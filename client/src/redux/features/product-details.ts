import { createSlice } from "@reduxjs/toolkit";
import { Product } from "@/types/product";

type InitialState = {
  value: Product;
};

const initialState = {
  value: {
    id: "",
    title: "",
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    material: "",
    categoryId: "",
    categoryName: "",
    categorySlug: "",
    reviews: 0,
    price: 0,
    discountedPrice: 0,
    imgs: { thumbnails: [], previews: [] },
    colors: [],
    sizes: [],
    totalStock: 0,
    inStock: false,
    status: "ACTIVE",
    createdAt: "",
    updatedAt: "",
  },
} as InitialState;

export const productDetails = createSlice({
  name: "productDetails",
  initialState,
  reducers: {
    updateproductDetails: (_, action) => {
      return {
        value: {
          ...action.payload,
        },
      };
    },
  },
});

export const { updateproductDetails } = productDetails.actions;
export default productDetails.reducer;
