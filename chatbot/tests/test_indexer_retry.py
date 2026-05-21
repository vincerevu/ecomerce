import httpx
import pytest

from app.services.ecommerce_client import ProductSummary
from app.services.indexing import ProductIndexer


class FakeEcommerceClient:
    pass


class FakeDocumentIndex:
    async def get_metadatas(self, ids):
        return {}

    async def upsert(self, ids, contents, metadatas, embeddings) -> None:
        return None


class ExistingDocumentIndex:
    def __init__(self, content_hash: str) -> None:
        self.content_hash = content_hash
        self.upsert_calls = 0

    async def get_metadatas(self, ids):
        return {ids[0]: {"contentHash": self.content_hash}}

    async def upsert(self, ids, contents, metadatas, embeddings) -> None:
        self.upsert_calls += 1


class RateLimitedRetrievalClient:
    def __init__(self) -> None:
        self.calls = 0

    async def embed(self, texts: list[str], input_type: str | None = None) -> list[list[float]]:
        self.calls += 1
        if self.calls == 1:
            request = httpx.Request("POST", "https://api.voyageai.com/v1/embeddings")
            response = httpx.Response(429, request=request)
            raise httpx.HTTPStatusError("rate limited", request=request, response=response)
        return [[0.1, 0.2] for _ in texts]


@pytest.mark.asyncio
async def test_product_indexer_retries_embedding_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    retrieval_client = RateLimitedRetrievalClient()

    async def no_sleep(_: int) -> None:
        return None

    monkeypatch.setattr("app.services.indexing.asyncio.sleep", no_sleep)
    indexer = ProductIndexer(
        ecommerce_client=FakeEcommerceClient(),
        retrieval_client=retrieval_client,
        document_index=FakeDocumentIndex(),
        embed_retries=2,
    )
    product = ProductSummary(
        id="product-1",
        name="Áo khoác",
        slug="ao-khoac",
        short_description="Mô tả",
        price=399000,
        thumbnail_url=None,
        total_stock=1,
    )

    await indexer._upsert_products([product])

    assert retrieval_client.calls == 2


@pytest.mark.asyncio
async def test_product_indexer_skips_unchanged_documents() -> None:
    product = ProductSummary(
        id="product-1",
        name="Áo khoác",
        slug="ao-khoac",
        short_description="Mô tả",
        price=399000,
        thumbnail_url=None,
        total_stock=1,
    )
    from app.services.indexing import build_product_document
    import hashlib

    content_hash = hashlib.sha256(build_product_document(product).encode("utf-8")).hexdigest()
    index = ExistingDocumentIndex(content_hash)
    indexer = ProductIndexer(
        ecommerce_client=FakeEcommerceClient(),
        retrieval_client=RateLimitedRetrievalClient(),
        document_index=index,
    )

    await indexer._upsert_products([product])

    assert index.upsert_calls == 0
