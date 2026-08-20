import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, UserDataProvider, useUserData } from "@/contexts/auth-context";

let sessionState: { data: { user: { id: string; role: "user"; permissions: string[]; name: string; email: string; image: string | null } } | null; status: "authenticated" | "unauthenticated" };

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => sessionState,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

function ProfileProbe() {
  const { profile, addresses, isLoading } = useUserData();
  return <p>{isLoading ? "loading" : `${profile?.id ?? "none"}:${addresses.length}`}</p>;
}

describe("UserDataProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionState = {
      data: {
        user: {
          id: "user_1",
          role: "user",
          permissions: [],
          name: "User One",
          email: "one@example.com",
          image: null,
        },
      },
      status: "authenticated",
    };
  });

  it("loads data for the active user and clears it after logout", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        profile: { id: "user_1", name: "User One", email: "one@example.com", image: "", phone: "" },
        addresses: [{ id: "address_1" }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const view = render(
      <AuthProvider>
        <UserDataProvider>
          <ProfileProbe />
        </UserDataProvider>
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("user_1:1")).toBeDefined());

    sessionState = { data: null, status: "unauthenticated" };
    view.rerender(
      <AuthProvider>
        <UserDataProvider>
          <ProfileProbe />
        </UserDataProvider>
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("none:0")).toBeDefined());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
