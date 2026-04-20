import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { ProductImageSet } from "@/types/product";

type InitialState = {
  items: CartItem[];
  selectedItemIds: string[];
};

export type CartItem = {
  id: string;
  productId?: string;
  productSlug?: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs?: ProductImageSet;
  variantId?: string;
  colorId?: string;
  colorName?: string;
  sizeName?: string;
  imageUrl?: string;
  source?: "local" | "server";
};

const initialState: InitialState = {
  items: [],
  selectedItemIds: [],
};

const buildCartSelectionKey = (item: Pick<CartItem, "id" | "productId" | "variantId">) =>
  item.id || `${item.productId || ""}:${item.variantId || ""}`;

export const cart = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItemToCart: (state, action: PayloadAction<CartItem>) => {
      const { id, title, price, quantity, discountedPrice, imgs } =
        action.payload;
      const existingItem = state.items.find((item) => item.id === id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          id,
          productId: action.payload.productId,
          productSlug: action.payload.productSlug,
          title,
          price,
          quantity,
          discountedPrice,
          imgs,
          variantId: action.payload.variantId,
          colorId: action.payload.colorId,
          colorName: action.payload.colorName,
          sizeName: action.payload.sizeName,
          imageUrl: action.payload.imageUrl,
          source: action.payload.source,
        });
        state.selectedItemIds.push(id);
      }
    },
    removeItemFromCart: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.items = state.items.filter((item) => item.id !== itemId);
      state.selectedItemIds = state.selectedItemIds.filter((id) => id !== itemId);
    },
    updateCartItemQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const { id, quantity } = action.payload;
      const existingItem = state.items.find((item) => item.id === id);

      if (existingItem) {
        existingItem.quantity = quantity;
      }
    },
    updateCartItemSelection: (
      state,
      action: PayloadAction<{
        id: string;
        price: number;
        discountedPrice: number;
        imgs?: ProductImageSet;
        variantId?: string;
        colorId?: string;
        colorName?: string;
        sizeName?: string;
        imageUrl?: string;
      }>
    ) => {
      const existingItem = state.items.find((item) => item.id === action.payload.id);

      if (existingItem) {
        existingItem.price = action.payload.price;
        existingItem.discountedPrice = action.payload.discountedPrice;
        existingItem.imgs = action.payload.imgs;
        existingItem.variantId = action.payload.variantId;
        existingItem.colorId = action.payload.colorId;
        existingItem.colorName = action.payload.colorName;
        existingItem.sizeName = action.payload.sizeName;
        existingItem.imageUrl = action.payload.imageUrl;
      }
    },

    removeAllItemsFromCart: (state) => {
      state.items = [];
      state.selectedItemIds = [];
    },
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      const previousSelections = new Set(state.selectedItemIds);
      const previousItemsByKey = new Map(
        state.items.map((item) => [buildCartSelectionKey(item), item.id])
      );

      state.items = action.payload;
      state.selectedItemIds = action.payload
        .filter((item) => {
          const selectionKey = buildCartSelectionKey(item);
          const previousItemId = previousItemsByKey.get(selectionKey);

          if (previousSelections.has(item.id)) {
            return true;
          }

          if (previousItemId && previousSelections.has(previousItemId)) {
            return true;
          }

          if (!previousItemId) {
            return true;
          }

          return false;
        })
        .map((item) => item.id);
    },
    toggleCartItemSelection: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const isSelected = state.selectedItemIds.includes(itemId);

      state.selectedItemIds = isSelected
        ? state.selectedItemIds.filter((id) => id !== itemId)
        : [...state.selectedItemIds, itemId];
    },
    setAllCartItemSelections: (state, action: PayloadAction<boolean>) => {
      state.selectedItemIds = action.payload ? state.items.map((item) => item.id) : [];
    },
  },
});

export const selectCartItems = (state: RootState) => state.cartReducer.items;
export const selectSelectedItemIds = (state: RootState) =>
  state.cartReducer.selectedItemIds;

export const selectSelectedCartItems = createSelector(
  [selectCartItems, selectSelectedItemIds],
  (items, selectedItemIds) => {
    const selectedIds = new Set(selectedItemIds);
    return items.filter((item) => selectedIds.has(item.id));
  }
);

export const selectAreAllCartItemsSelected = createSelector(
  [selectCartItems, selectSelectedItemIds],
  (items, selectedItemIds) =>
    items.length > 0 && items.every((item) => selectedItemIds.includes(item.id))
);

export const selectTotalPrice = createSelector([selectCartItems], (items) => {
  return items.reduce((total, item) => {
    return total + item.discountedPrice * item.quantity;
  }, 0);
});

export const selectSelectedTotalPrice = createSelector(
  [selectSelectedCartItems],
  (items) =>
    items.reduce((total, item) => {
      return total + item.discountedPrice * item.quantity;
    }, 0)
);

export const {
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  updateCartItemSelection,
  removeAllItemsFromCart,
  setCartItems,
  toggleCartItemSelection,
  setAllCartItemSelections,
} = cart.actions;
export default cart.reducer;
