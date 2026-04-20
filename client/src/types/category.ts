export type Category = {
  id: string;
  title: string;
  name: string;
  slug: string;
  img: string;
  description: string;
  sortOrder: number;
  parentId: string | null;
  parentName: string | null;
};

export type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  sortOrder?: number;
  parent?: {
    id: string;
    name: string;
    slug: string;
    iconUrl?: string;
  } | null;
};

export const CATEGORY_PLACEHOLDER = "/images/arrivals/arrivals-02.png";

const ALLOWED_REMOTE_HOSTS = new Set([
  "images.unsplash.com",
  "plus.unsplash.com",
  "res.cloudinary.com",
  "buggy.yodycdn.com",
  "localhost",
  "127.0.0.1",
]);

export const normalizeCategory = (category: CategoryResponse): Category => ({
  id: category.id,
  title: category.name,
  name: category.name,
  slug: category.slug,
  img: sanitizeCategoryImageUrl(category.iconUrl || category.parent?.iconUrl),
  description: category.description || "",
  sortOrder: category.sortOrder || 0,
  parentId: category.parent?.id || null,
  parentName: category.parent?.name || null,
});

export const hasRealCategoryImage = (category: Category) =>
  Boolean(category.img) && category.img !== CATEGORY_PLACEHOLDER;

const sanitizeCategoryImageUrl = (imageUrl?: string) => {
  if (!imageUrl) {
    return CATEGORY_PLACEHOLDER;
  }

  if (imageUrl.startsWith("/")) {
    return imageUrl;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    return isAllowedRemoteHost(parsedUrl.hostname)
      ? imageUrl
      : CATEGORY_PLACEHOLDER;
  } catch {
    return CATEGORY_PLACEHOLDER;
  }
};

const isAllowedRemoteHost = (hostname: string) =>
  ALLOWED_REMOTE_HOSTS.has(hostname) ||
  hostname === "yodycdn.com" ||
  hostname.endsWith(".yodycdn.com");
