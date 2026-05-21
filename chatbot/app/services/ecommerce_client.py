from dataclasses import dataclass
from typing import Any

import httpx


@dataclass(frozen=True)
class ProductSummary:
    id: str
    name: str
    slug: str | None
    short_description: str | None
    price: float | None
    thumbnail_url: str | None
    total_stock: int | None


@dataclass(frozen=True)
class ProductVariant:
    id: str
    size_name: str | None
    original_price: float | None
    sale_price: float | None
    stock_quantity: int | None


@dataclass(frozen=True)
class ProductColor:
    id: str
    color_name: str | None
    hex_code: str | None
    image_urls: tuple[str, ...]
    variants: tuple[ProductVariant, ...]


@dataclass(frozen=True)
class ProductDetail:
    id: str
    name: str
    slug: str | None
    short_description: str | None
    description: str | None
    material: str | None
    gender: str | None
    style: str | None
    status: str | None
    category_name: str | None
    category_slug: str | None
    tags: tuple[str, ...]
    colors: tuple[ProductColor, ...]
    thumbnail_url: str | None

    @property
    def total_stock(self) -> int:
        return sum((variant.stock_quantity or 0) for color in self.colors for variant in color.variants)

    @property
    def display_price(self) -> float | None:
        prices = [
            variant.sale_price if variant.sale_price is not None else variant.original_price
            for color in self.colors
            for variant in color.variants
            if variant.sale_price is not None or variant.original_price is not None
        ]
        return min(prices) if prices else None


class EcommerceClient:
    def __init__(self, base_url: str, timeout_seconds: float = 10) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_seconds

    async def search_products(self, query: str, bearer_token: str | None = None, size: int = 8) -> list[ProductSummary]:
        headers = self._auth_headers(bearer_token)
        filter_value = self._build_keyword_filter(query)
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self._base_url}/products",
                params={
                    "page": 0,
                    "size": size,
                    "sort": "createdAt,desc",
                    **({"filter": filter_value} if filter_value else {}),
                },
                headers=headers,
            )
            response.raise_for_status()
            payload = response.json()
        return [self._to_product(item) for item in payload.get("result", {}).get("data", [])]

    async def list_products(self, page: int = 0, size: int = 100) -> tuple[list[ProductSummary], bool]:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self._base_url}/products",
                params={"page": page, "size": size, "sort": "updatedAt,desc"},
            )
            response.raise_for_status()
            payload = response.json()

        result = payload.get("result", {})
        return [self._to_product(item) for item in result.get("data", [])], bool(result.get("last", True))

    async def get_product_detail(self, slug: str) -> ProductDetail:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(f"{self._base_url}/products/slug/{slug}")
            response.raise_for_status()
            payload = response.json()
        return self._to_product_detail(payload.get("result", {}))

    @staticmethod
    def _auth_headers(bearer_token: str | None) -> dict[str, str]:
        if not bearer_token:
            return {}
        return {"Authorization": bearer_token}

    @staticmethod
    def _build_keyword_filter(query: str) -> str:
        keyword = query.strip().replace("'", "\\'")
        if not keyword:
            return ""
        fields = [
            "name",
            "slug",
            "shortDescription",
            "description",
            "gender",
            "style",
            "category.name",
            "category.slug",
        ]
        return "(" + " or ".join(f"{field}~'{keyword}'" for field in fields) + ")"

    @staticmethod
    def _to_product(item: dict[str, Any]) -> ProductSummary:
        price = item.get("displayPrice") or item.get("minSalePrice") or item.get("minOriginalPrice")
        return ProductSummary(
            id=str(item.get("id", "")),
            name=str(item.get("name", "")),
            slug=item.get("slug"),
            short_description=item.get("shortDescription"),
            price=float(price) if price is not None else None,
            thumbnail_url=item.get("thumbnailUrl"),
            total_stock=item.get("totalStock"),
        )

    @classmethod
    def _to_product_detail(cls, item: dict[str, Any]) -> ProductDetail:
        category = item.get("category") or {}
        colors = tuple(cls._to_color(color) for color in item.get("colors", []) or [])
        thumbnail_url = cls._find_thumbnail_url(colors)
        return ProductDetail(
            id=str(item.get("id", "")),
            name=str(item.get("name", "")),
            slug=item.get("slug"),
            short_description=item.get("shortDescription"),
            description=item.get("description"),
            material=item.get("material"),
            gender=item.get("gender"),
            style=item.get("style"),
            status=item.get("status"),
            category_name=category.get("name"),
            category_slug=category.get("slug"),
            tags=tuple(
                tag.get("name") or tag.get("slug")
                for tag in (item.get("tags", []) or [])
                if tag.get("name") or tag.get("slug")
            ),
            colors=colors,
            thumbnail_url=thumbnail_url,
        )

    @classmethod
    def _to_color(cls, item: dict[str, Any]) -> ProductColor:
        images = tuple(
            image.get("url")
            for image in (item.get("images", []) or [])
            if image.get("url")
        )
        variants = tuple(cls._to_variant(variant) for variant in item.get("variants", []) or [])
        return ProductColor(
            id=str(item.get("id", "")),
            color_name=item.get("colorName"),
            hex_code=item.get("hexCode"),
            image_urls=images,
            variants=variants,
        )

    @staticmethod
    def _to_variant(item: dict[str, Any]) -> ProductVariant:
        return ProductVariant(
            id=str(item.get("id", "")),
            size_name=item.get("sizeName"),
            original_price=EcommerceClient._to_float(item.get("originalPrice")),
            sale_price=EcommerceClient._to_float(item.get("salePrice")),
            stock_quantity=item.get("stockQuantity"),
        )

    @staticmethod
    def _find_thumbnail_url(colors: tuple[ProductColor, ...]) -> str | None:
        for color in colors:
            if color.image_urls:
                return color.image_urls[0]
        return None

    @staticmethod
    def _to_float(value: Any) -> float | None:
        return float(value) if value is not None else None
