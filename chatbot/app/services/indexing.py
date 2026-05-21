import asyncio
import hashlib

import httpx

from app.services.ecommerce_client import EcommerceClient, ProductDetail, ProductSummary
from app.services.retrieval import RetrievalClient
from app.services.vector_store import DocumentIndex


def build_product_document(product: ProductSummary | ProductDetail) -> str:
    stock_text = "còn hàng" if (product.total_stock or 0) > 0 else "hết hàng hoặc chưa rõ tồn kho"
    if isinstance(product, ProductDetail):
        colors = sorted({color.color_name for color in product.colors if color.color_name})
        sizes = sorted({variant.size_name for color in product.colors for variant in color.variants if variant.size_name})
        sale_prices = [
            variant.sale_price if variant.sale_price is not None else variant.original_price
            for color in product.colors
            for variant in color.variants
            if variant.sale_price is not None or variant.original_price is not None
        ]
        min_price = min(sale_prices) if sale_prices else product.display_price
        max_price = max(sale_prices) if sale_prices else product.display_price
        parts = [
            f"Tên sản phẩm: {product.name}",
            f"Slug: {product.slug or ''}",
            f"Trạng thái: {product.status or ''}",
            f"Danh mục: {product.category_name or ''} ({product.category_slug or ''})",
            f"Tags: {', '.join(product.tags)}",
            f"Giới tính: {product.gender or ''}",
            f"Phong cách: {product.style or ''}",
            f"Chất liệu: {product.material or ''}",
            f"Màu sắc: {', '.join(colors)}",
            f"Size: {', '.join(sizes)}",
            f"Giá thấp nhất: {min_price if min_price is not None else 'chưa rõ'}",
            f"Giá cao nhất: {max_price if max_price is not None else 'chưa rõ'}",
            f"Tổng tồn kho: {product.total_stock}",
            f"Tình trạng: {stock_text}",
            f"Mô tả ngắn: {product.short_description or ''}",
            f"Mô tả chi tiết: {product.description or ''}",
        ]
        return "\n".join(parts)

    parts = [
        f"Tên sản phẩm: {product.name}",
        f"Slug: {product.slug or ''}",
        f"Mô tả ngắn: {product.short_description or ''}",
        f"Giá hiển thị: {product.price if product.price is not None else 'chưa rõ'}",
        f"Tình trạng: {stock_text}",
    ]
    return "\n".join(parts)


class ProductIndexer:
    def __init__(
        self,
        ecommerce_client: EcommerceClient,
        retrieval_client: RetrievalClient,
        document_index: DocumentIndex,
        batch_size: int = 16,
        embed_retries: int = 4,
        start_page: int = 0,
        max_products: int | None = None,
    ) -> None:
        self._ecommerce = ecommerce_client
        self._retrieval_client = retrieval_client
        self._document_index = document_index
        self._batch_size = batch_size
        self._embed_retries = embed_retries
        self._start_page = start_page
        self._max_products = max_products

    async def sync_products(self) -> int:
        page = self._start_page
        synced = 0
        while True:
            products, is_last_page = await self._ecommerce.list_products(page=page, size=self._batch_size)
            if not products:
                break
            if self._max_products is not None:
                remaining = self._max_products - synced
                if remaining <= 0:
                    break
                products = products[:remaining]

            details = await self._load_product_details(products)
            await self._upsert_products(details)
            synced += len(details)

            if is_last_page or (self._max_products is not None and synced >= self._max_products):
                break
            page += 1
        return synced

    async def _load_product_details(self, products: list[ProductSummary]) -> list[ProductSummary | ProductDetail]:
        async def load_one(product: ProductSummary) -> ProductSummary | ProductDetail:
            if not product.slug:
                return product
            try:
                return await self._ecommerce.get_product_detail(product.slug)
            except Exception:
                return product

        return list(await asyncio.gather(*(load_one(product) for product in products)))

    async def _upsert_products(self, products: list[ProductSummary | ProductDetail]) -> None:
        contents = [build_product_document(product) for product in products]
        ids = [f"product:{product.id}" for product in products]
        content_hashes = [hashlib.sha256(content.encode("utf-8")).hexdigest() for content in contents]
        existing = await self._document_index.get_metadatas(ids)
        pending_indexes = [
            index
            for index, document_id in enumerate(ids)
            if existing.get(document_id, {}).get("contentHash") != content_hashes[index]
        ]
        if not pending_indexes:
            return

        pending_contents = [contents[index] for index in pending_indexes]
        embeddings = await self._embed_with_retry(pending_contents)
        if len(embeddings) != len(pending_indexes):
            raise RuntimeError("Embedding count did not match product count")

        metadatas = [
            {
                "sourceType": "product",
                "source_id": product.id,
                "name": product.name,
                "slug": product.slug,
                "price": product.display_price if isinstance(product, ProductDetail) else product.price,
                "thumbnailUrl": product.thumbnail_url,
                "totalStock": product.total_stock,
                "category": product.category_name if isinstance(product, ProductDetail) else None,
                "gender": product.gender if isinstance(product, ProductDetail) else None,
                "status": product.status if isinstance(product, ProductDetail) else None,
                "contentHash": content_hashes[index],
            }
            for index, product in enumerate(products)
        ]
        await self._document_index.upsert(
            ids=[ids[index] for index in pending_indexes],
            contents=pending_contents,
            metadatas=[metadatas[index] for index in pending_indexes],
            embeddings=embeddings,
        )

    async def _embed_with_retry(self, contents: list[str]) -> list[list[float]]:
        delay_seconds = 2
        last_error: Exception | None = None
        for attempt in range(self._embed_retries):
            try:
                return await self._retrieval_client.embed(contents, input_type="document")
            except httpx.HTTPStatusError as exc:
                last_error = exc
                if exc.response.status_code != 429 or attempt == self._embed_retries - 1:
                    raise
                retry_after = exc.response.headers.get("retry-after")
                wait_seconds = int(retry_after) if retry_after and retry_after.isdigit() else delay_seconds
                await asyncio.sleep(wait_seconds)
                delay_seconds *= 2
        raise RuntimeError(f"Embedding failed after retries: {last_error}")
