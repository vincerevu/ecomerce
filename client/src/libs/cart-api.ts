import apiClient from "./api-client";

type ApiResponse<T> = {
  code: number;
  message: string;
  result: T;
};

export type ServerCartItem = {
  id: number;
  productId: string;
  productVariantId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  colorId: string | null;
  colorName: string | null;
  sizeName: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type ServerCart = {
  items: ServerCartItem[];
  subtotal: number;
  itemCount: number;
};

export type CartItemRequest = {
  productId: string;
  productVariantId: string;
  quantity: number;
};

export type UpdateCartItemRequest = {
  quantity?: number;
  productVariantId?: string;
};

const unwrap = <T>(response: ApiResponse<T>) => response.result;

const ensureResult = <T>(response: ApiResponse<T> | undefined) => {
  if (!response || typeof response !== "object" || !("result" in response)) {
    throw new Error("Phản hồi giỏ hàng không hợp lệ");
  }

  return unwrap(response);
};

export const cartApi = {
  async getCart(): Promise<ServerCart> {
    const response = await apiClient.get<ApiResponse<ServerCart>, ApiResponse<ServerCart>>(
      "/checkout/cart"
    );
    return ensureResult(response);
  },

  async addItem(payload: CartItemRequest): Promise<ServerCart> {
    const response = await apiClient.post<ApiResponse<ServerCart>, ApiResponse<ServerCart>>(
      "/checkout/cart/items",
      payload,
    );
    return ensureResult(response);
  },

  async updateItem(itemId: string, payload: UpdateCartItemRequest): Promise<ServerCart> {
    const response = await apiClient.put<ApiResponse<ServerCart>, ApiResponse<ServerCart>>(
      `/checkout/cart/items/${itemId}`,
      payload,
    );
    return ensureResult(response);
  },

  async removeItem(itemId: string): Promise<ServerCart> {
    const response = await apiClient.delete<ApiResponse<ServerCart>, ApiResponse<ServerCart>>(
      `/checkout/cart/items/${itemId}`,
    );
    return ensureResult(response);
  },

  async clearCart(): Promise<void> {
    await apiClient.delete("/checkout/cart/items");
  },
};
