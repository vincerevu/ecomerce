import pytest

from app.services.ecommerce_client import ProductSummary
from app.services.indexing import ProductIndexer


class PagedEcommerceClient:
    def __init__(self) -> None:
        self.pages: list[int] = []

    async def list_products(self, page: int = 0, size: int = 100):
        self.pages.append(page)
        products = [
            ProductSummary(
                id=f"product-{page}-{index}",
                name=f"Product {page}-{index}",
                slug=None,
                short_description=None,
                price=None,
                thumbnail_url=None,
                total_stock=0,
            )
            for index in range(size)
        ]
        return products, False


class FakeRetrievalClient:
    async def embed(self, texts: list[str], input_type: str | None = None):
        return [[0.1, 0.2] for _ in texts]


class CapturingIndex:
    def __init__(self) -> None:
        self.ids: list[str] = []

    async def get_metadatas(self, ids):
        return {}

    async def upsert(self, ids, contents, metadatas, embeddings) -> None:
        self.ids.extend(ids)


@pytest.mark.asyncio
async def test_product_indexer_supports_start_page_and_max_products() -> None:
    ecommerce = PagedEcommerceClient()
    index = CapturingIndex()
    indexer = ProductIndexer(
        ecommerce_client=ecommerce,
        retrieval_client=FakeRetrievalClient(),
        document_index=index,
        batch_size=4,
        start_page=3,
        max_products=6,
    )

    synced = await indexer.sync_products()

    assert synced == 6
    assert ecommerce.pages == [3, 4]
    assert len(index.ids) == 6
