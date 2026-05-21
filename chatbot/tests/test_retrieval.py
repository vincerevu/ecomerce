import pytest

from app.services.retrieval import RetrievalService
from app.services.vector_store import RetrievalDocument
from app.services.voyage import RerankResult


class FakeRetrievalClient:
    async def embed(self, texts: list[str], input_type: str | None = None) -> list[list[float]]:
        assert input_type == "query"
        return [[0.1, 0.2, 0.3]]

    async def rerank(self, query: str, documents: list[str], top_k: int) -> list[RerankResult]:
        return [RerankResult(index=1, relevance_score=0.99), RerankResult(index=0, relevance_score=0.5)]


class BrokenRerankClient(FakeRetrievalClient):
    async def rerank(self, query: str, documents: list[str], top_k: int) -> list[RerankResult]:
        raise RuntimeError("rerank unavailable")


class FakeVectorStore:
    async def search(self, embedding: list[float], limit: int = 20) -> list[RetrievalDocument]:
        return [
            RetrievalDocument(id="doc-1", content="Áo thun cotton", metadata={}, score=0.8),
            RetrievalDocument(id="doc-2", content="Áo khoác chống nắng", metadata={}, score=0.7),
        ]


@pytest.mark.asyncio
async def test_retrieval_embeds_searches_and_reranks() -> None:
    service = RetrievalService(FakeRetrievalClient(), FakeVectorStore(), rerank_enabled=True, final_limit=2)

    results = await service.retrieve("áo khoác")

    assert [item.id for item in results] == ["doc-2", "doc-1"]


@pytest.mark.asyncio
async def test_retrieval_falls_back_to_vector_order_when_rerank_fails() -> None:
    service = RetrievalService(BrokenRerankClient(), FakeVectorStore(), rerank_enabled=True, final_limit=1)

    results = await service.retrieve("áo khoác")

    assert [item.id for item in results] == ["doc-1"]
