import reducer, {
  addItemToCart,
  removeAllItemsFromCart,
  removeItemFromCart,
  setCartItems,
  updateCartItemQuantity,
  updateCartItemSelection,
  type CartItem,
} from "./cart-slice";

const createItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: "cart-item-1",
  productId: "product-1",
  productSlug: "ao-thun-basic",
  title: "Ao thun basic",
  price: 199000,
  discountedPrice: 149000,
  quantity: 1,
  variantId: "variant-1",
  colorId: "color-1",
  colorName: "Den",
  sizeName: "M",
  imageUrl: "/images/product-1.png",
  ...overrides,
});

describe("cart slice", () => {
  it("adds a new item and merges quantity for the same id", () => {
    const firstState = reducer(undefined, addItemToCart(createItem()));
    const nextState = reducer(
      firstState,
      addItemToCart(createItem({ quantity: 2, discountedPrice: 159000 }))
    );

    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0]).toMatchObject({
      id: "cart-item-1",
      quantity: 3,
      discountedPrice: 149000,
    });
  });

  it("updates quantity and selection metadata for an existing line", () => {
    const populatedState = reducer(undefined, setCartItems([createItem()]));
    const quantityState = reducer(
      populatedState,
      updateCartItemQuantity({ id: "cart-item-1", quantity: 4 })
    );
    const selectionState = reducer(
      quantityState,
      updateCartItemSelection({
        id: "cart-item-1",
        price: 259000,
        discountedPrice: 219000,
        variantId: "variant-2",
        colorId: "color-2",
        colorName: "Trang",
        sizeName: "L",
        imageUrl: "/images/product-2.png",
      })
    );

    expect(selectionState.items[0]).toMatchObject({
      quantity: 4,
      price: 259000,
      discountedPrice: 219000,
      variantId: "variant-2",
      colorName: "Trang",
      sizeName: "L",
      imageUrl: "/images/product-2.png",
    });
  });

  it("removes one item and clears the whole cart", () => {
    const populatedState = reducer(
      undefined,
      setCartItems([createItem(), createItem({ id: "cart-item-2", variantId: "variant-3" })])
    );
    const removedState = reducer(populatedState, removeItemFromCart("cart-item-1"));
    const clearedState = reducer(removedState, removeAllItemsFromCart());

    expect(removedState.items).toHaveLength(1);
    expect(removedState.items[0].id).toBe("cart-item-2");
    expect(clearedState.items).toHaveLength(0);
  });
});
