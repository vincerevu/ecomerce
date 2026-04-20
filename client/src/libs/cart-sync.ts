import { ProductImageSet } from "@/types/product";
import { store } from "@/redux/store";
import {
  addItemToCart,
  removeAllItemsFromCart,
  removeItemFromCart,
  setCartItems,
  updateCartItemQuantity,
  updateCartItemSelection,
  type CartItem,
} from "@/redux/features/cart-slice";
import { cartApi, type ServerCart, type ServerCartItem } from "./cart-api";
import { getAccessToken } from "./auth-storage";

const hasSession = () => Boolean(getAccessToken());

const buildImageSet = (imageUrl?: string | null): ProductImageSet | undefined => {
  if (!imageUrl) {
    return undefined;
  }

  return {
    thumbnails: [imageUrl],
    previews: [imageUrl],
  };
};

const toClientCartItem = (item: ServerCartItem): CartItem => ({
  id: String(item.id),
  productId: item.productId,
  productSlug: item.productSlug,
  title: item.productName,
  price: item.unitPrice,
  discountedPrice: item.unitPrice,
  quantity: item.quantity,
  imgs: buildImageSet(item.imageUrl),
  variantId: item.productVariantId,
  colorId: item.colorId ?? undefined,
  colorName: item.colorName ?? undefined,
  sizeName: item.sizeName ?? undefined,
  imageUrl: item.imageUrl ?? undefined,
  source: "server",
});

const buildItemKey = (item: Pick<CartItem, "productId" | "variantId">) =>
  `${item.productId || ""}:${item.variantId || ""}`;

const replaceFromServer = (cart: ServerCart, preservedLocalItems: CartItem[] = []) => {
  const serverItems = cart.items.map(toClientCartItem);
  const existingKeys = new Set(serverItems.map(buildItemKey));
  const mergedItems = [
    ...serverItems,
    ...preservedLocalItems.filter((item) => !existingKeys.has(buildItemKey(item))),
  ];

  store.dispatch(setCartItems(mergedItems));
};

const mergeLocalItemsIntoServer = async (): Promise<CartItem[]> => {
  const localItems = store
    .getState()
    .cartReducer.items.filter(
      (item) =>
        item.source !== "server" &&
        typeof item.productId === "string" &&
        item.productId.length > 0 &&
        typeof item.variantId === "string" &&
        item.variantId.length > 0,
    );

  const failedItems: CartItem[] = [];

  for (const item of localItems) {
    try {
      await cartApi.addItem({
        productId: item.productId as string,
        productVariantId: item.variantId as string,
        quantity: item.quantity,
      });
    } catch (error) {
      console.error("Không thể đồng bộ sản phẩm cục bộ lên server", error);
      failedItems.push({ ...item, source: "local" });
    }
  }

  return failedItems;
};

export const hydrateCartFromServer = async () => {
  if (!hasSession()) {
    return;
  }

  const failedLocalItems = await mergeLocalItemsIntoServer();
  const cart = await cartApi.getCart();
  replaceFromServer(cart, failedLocalItems);
};

export const syncAddCartItem = async (item: CartItem) => {
  if (!hasSession() || !item.variantId || !item.productId) {
    store.dispatch(addItemToCart({ ...item, source: "local" }));
    return;
  }

  try {
    const cart = await cartApi.addItem({
      productId: item.productId as string,
      productVariantId: item.variantId,
      quantity: item.quantity,
    });
    replaceFromServer(cart);
  } catch (error) {
    console.error("Không thể đồng bộ giỏ hàng với server, sẽ giữ ở local", error);
    store.dispatch(addItemToCart({ ...item, source: "local" }));
  }
};

export const syncRemoveCartItem = async (itemId: string) => {
  const item = store.getState().cartReducer.items.find((cartItem) => cartItem.id === itemId);

  if (!hasSession() || item?.source !== "server") {
    store.dispatch(removeItemFromCart(itemId));
    return;
  }

  try {
    const cart = await cartApi.removeItem(itemId);
    replaceFromServer(cart);
  } catch (error) {
    console.error("Không thể xoá sản phẩm trên server, sẽ xoá ở local", error);
    store.dispatch(removeItemFromCart(itemId));
  }
};

export const syncUpdateCartItemQuantity = async (itemId: string, quantity: number) => {
  const item = store.getState().cartReducer.items.find((cartItem) => cartItem.id === itemId);

  if (!hasSession() || item?.source !== "server") {
    store.dispatch(updateCartItemQuantity({ id: itemId, quantity }));
    return;
  }

  try {
    const cart = await cartApi.updateItem(itemId, { quantity });
    replaceFromServer(cart);
  } catch (error) {
    console.error("Không thể cập nhật số lượng trên server, sẽ cập nhật ở local", error);
    store.dispatch(updateCartItemQuantity({ id: itemId, quantity }));
  }
};

export const syncUpdateCartItemSelection = async (
  itemId: string,
  selection: {
    price: number;
    discountedPrice: number;
    imgs?: ProductImageSet;
    variantId?: string;
    colorId?: string;
    colorName?: string;
    sizeName?: string;
    imageUrl?: string;
  },
) => {
  const item = store.getState().cartReducer.items.find((cartItem) => cartItem.id === itemId);

  if (!hasSession() || item?.source !== "server" || !selection.variantId) {
    store.dispatch(updateCartItemSelection({ id: itemId, ...selection }));
    return;
  }

  try {
    const cart = await cartApi.updateItem(itemId, {
      productVariantId: selection.variantId,
      quantity: item.quantity,
    });
    replaceFromServer(cart);
  } catch (error) {
    console.error("Không thể đồng bộ lựa chọn giỏ hàng với server, sẽ cập nhật ở local", error);
    store.dispatch(updateCartItemSelection({ id: itemId, ...selection }));
  }
};

export const syncClearCart = async () => {
  if (!hasSession()) {
    store.dispatch(removeAllItemsFromCart());
    return;
  }

  await cartApi.clearCart();
  store.dispatch(setCartItems([]));
};
