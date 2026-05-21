from app.services.vector_store import RetrievalDocument, VectorStore


class RetrievalClient:
    async def embed(self, texts: list[str], input_type: str | None = None) -> list[list[float]]:
        raise NotImplementedError

    async def rerank(self, query: str, documents: list[str], top_k: int):
        raise NotImplementedError


class RetrievalService:
    def __init__(
        self,
        retrieval_client: RetrievalClient,
        vector_store: VectorStore,
        rerank_enabled: bool = True,
        search_limit: int = 20,
        final_limit: int = 5,
    ) -> None:
        self._retrieval_client = retrieval_client
        self._vector_store = vector_store
        self._rerank_enabled = rerank_enabled
        self._search_limit = search_limit
        self._final_limit = final_limit

    async def retrieve(self, query: str) -> list[RetrievalDocument]:
        embeddings = await self._retrieval_client.embed([query], input_type="query")
        if not embeddings:
            return []

        candidates = await self._vector_store.search(embeddings[0], limit=self._search_limit)
        if not candidates:
            return []

        if not self._rerank_enabled:
            return candidates[: self._final_limit]

        try:
            reranked = await self._retrieval_client.rerank(
                query=query,
                documents=[candidate.content for candidate in candidates],
                top_k=self._final_limit,
            )
        except Exception:
            return candidates[: self._final_limit]
        return [candidates[item.index] for item in reranked if item.index < len(candidates)]
