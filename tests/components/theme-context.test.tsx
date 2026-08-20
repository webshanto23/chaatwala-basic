import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "@/contexts/theme-context";

function ThemeConsumer() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("uses a saved theme without repeatedly toggling it", () => {
    localStorage.setItem("chaatwala-theme", "light");
    const { unmount } = render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);

    expect(screen.getByRole("button")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("chaatwala-theme")).toBe("light");
    unmount();
  });

  it("persists one explicit theme toggle", () => {
    const { unmount } = render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);

    act(() => screen.getByRole("button").click());

    expect(screen.getByRole("button")).toHaveTextContent("light");
    expect(localStorage.getItem("chaatwala-theme")).toBe("light");
    unmount();
  });
});
