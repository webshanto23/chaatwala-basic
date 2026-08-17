import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/shared/ProductCard";

vi.mock("@/components/shared/ProductCardActions", () => ({
  ProductCardActions: () => <div data-testid="product-card-actions">Actions</div>,
}));

describe("ProductCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    id: "dish_1",
    image: "https://example.com/dish.jpg",
    name: "Test Dish",
    price: 200,
    productType: "dish" as const,
  };

  it("renders product card container", () => {
    const { container } = render(<ProductCard {...defaultProps} />);
    const card = container.querySelector('[class*="rounded-"]');
    expect(card).toBeTruthy();
  });

  it("renders product content", () => {
    render(<ProductCard {...defaultProps} />);
    const actions = screen.getAllByTestId("product-card-actions");
    expect(actions.length).toBeGreaterThan(0);
  });

  it("accepts all required props without crashing", () => {
    const { container } = render(
      <ProductCard
        id="test"
        image="/test.jpg"
        name="Test"
        price={100}
        productType="dish"
      />
    );
    expect(container.innerHTML).toBeTruthy();
  });
});
