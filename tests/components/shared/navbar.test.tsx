import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "@/components/shared/Navbar";

const mockAuth = {
  auth: {
    isAuthenticated: false,
    role: null,
    name: null,
    permissions: [],
  },
  login: vi.fn(),
  logout: vi.fn(),
};

const mockPermissions = {
  can: vi.fn(() => false),
  canAny: vi.fn(() => false),
  canAll: vi.fn(() => false),
};

const mockCart = {
  cart: { id: "cart_1", items: [] },
  isLoading: false,
  error: null,
  totalItems: 0,
  total: 0,
  addItem: vi.fn(),
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(() => Promise.resolve()),
  refresh: vi.fn(),
};

const mockTheme = {
  theme: "dark" as const,
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
};

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/hooks/use-can", () => ({
  usePermissions: () => mockPermissions,
}));

vi.mock("@/features/cart/context", () => ({
  useCart: () => mockCart,
}));

vi.mock("@/contexts/theme-context", () => ({
  useTheme: () => mockTheme,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.auth.isAuthenticated = false;
    mockAuth.auth.role = null;
    mockAuth.auth.permissions = [];
    mockPermissions.can.mockReturnValue(false);
    mockCart.totalItems = 0;
    mockTheme.theme = "dark";
  });

  it("renders without crashing", () => {
    const { container } = render(<Navbar />);
    expect(container.innerHTML).toBeTruthy();
  });

  it("renders logo text", () => {
    render(<Navbar />);
    const logoTexts = screen.getAllByText(/Chaatwala/i);
    expect(logoTexts.length).toBeGreaterThan(0);
  });

  it("renders navigation links for public user", () => {
    render(<Navbar />);
    const homeLinks = screen.getAllByRole("link", { name: /home/i });
    expect(homeLinks.length).toBeGreaterThan(0);
  });

  it("renders theme toggle button", () => {
    render(<Navbar />);
    const themeButtons = screen.getAllByRole("button", { name: /toggle theme/i });
    expect(themeButtons.length).toBeGreaterThan(0);
  });

  it("calls toggleTheme when theme button is clicked", () => {
    render(<Navbar />);
    const themeButtons = screen.getAllByRole("button", { name: /toggle theme/i });
    fireEvent.click(themeButtons[0]);
    expect(mockTheme.toggleTheme).toHaveBeenCalled();
  });

  it("renders Sign In link for unauthenticated user", () => {
    render(<Navbar />);
    const signInLinks = screen.getAllByRole("link", { name: /sign in/i });
    expect(signInLinks.length).toBeGreaterThan(0);
  });

  it("renders mobile menu button", () => {
    render(<Navbar />);
    const menuButtons = screen.getAllByRole("button", { name: /open menu/i });
    expect(menuButtons.length).toBeGreaterThan(0);
  });

  it("renders Logout button for authenticated user", () => {
    mockAuth.auth.isAuthenticated = true;
    mockAuth.auth.name = "Test User";
    render(<Navbar />);
    const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
    expect(logoutButtons.length).toBeGreaterThan(0);
  });

  it("shows Admin Dashboard link for admin users", () => {
    mockAuth.auth.isAuthenticated = true;
    mockAuth.auth.role = "admin";
    mockPermissions.can.mockReturnValue(true);
    render(<Navbar />);
    expect(screen.getByText("Admin Dashboard")).toBeDefined();
  });

  it("shows Store Manager Dashboard for store managers", () => {
    mockAuth.auth.isAuthenticated = true;
    mockAuth.auth.role = "store_manager";
    mockPermissions.can
      .mockImplementation((perm: string) => perm === "store:view");
    render(<Navbar />);
    expect(screen.getByText("Store Manager Dashboard")).toBeDefined();
  });
});
