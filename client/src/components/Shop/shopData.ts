import { Product } from "@/types/product";

const baseProducts = [
  {
    title: "Áo thun nam Basic",
    reviews: 15,
    price: 150000,
    discountedPrice: 99000,
    id: "1",
    slug: "ao-thun-nam-basic",
    imgs: {
      thumbnails: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80",
      ],
      previews: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
      ],
    },
  },
  {
    title: "Váy hoa nhí Mùa Hè",
    reviews: 5,
    price: 350000,
    discountedPrice: 299000,
    id: "2",
    slug: "vay-hoa-nhi-mua-he",
    imgs: {
      thumbnails: [
        "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=500&q=80",
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80",
      ],
      previews: [
        "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&q=80",
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
      ],
    },
  },
  {
    title: "Quần Jean Slim Fit",
    reviews: 5,
    price: 450000,
    discountedPrice: 399000,
    id: "3",
    slug: "quan-jean-slim-fit",
    imgs: {
      thumbnails: [
        "https://images.unsplash.com/photo-1542272617-08f08630793c?w=500&q=80",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80",
      ],
      previews: [
        "https://images.unsplash.com/photo-1542272617-08f08630793c?w=800&q=80",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80",
      ],
    },
  },
  {
    title: "Áo khoác gió Yody",
    reviews: 6,
    price: 550000,
    discountedPrice: 499000,
    id: "4",
    slug: "ao-khoac-gio-yody",
    imgs: {
      thumbnails: [
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80",
        "https://images.unsplash.com/photo-1624029864268-b7c1969a84ba?w=500&q=80",
      ],
      previews: [
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
        "https://images.unsplash.com/photo-1624029864268-b7c1969a84ba?w=800&q=80",
      ],
    },
  },
];

const shopData: Product[] = baseProducts.map((item) => ({
  id: item.id,
  title: item.title,
  name: item.title,
  slug: item.slug,
  description: "",
  shortDescription: "",
  material: "",
  categoryId: "mock-category",
  categoryName: "Sản phẩm mẫu",
  categorySlug: "san-pham-mau",
  reviews: item.reviews,
  price: item.price,
  discountedPrice: item.discountedPrice,
  imgs: item.imgs,
  colors: [],
  sizes: [],
  totalStock: 10,
  inStock: true,
  status: "ACTIVE",
  createdAt: "",
  updatedAt: "",
}));

export default shopData;
