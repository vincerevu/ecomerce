from dataclasses import dataclass
from typing import Any

import httpx


@dataclass(frozen=True)
class RerankResult:
    index: int
    relevance_score: float


class VoyageClient:
    def __init__(
        self,
        api_key: str,
        embedding_model: str,
        rerank_model: str,
        timeout_seconds: float = 20,
    ) -> None:
        self._api_key = api_key
        self._embedding_model = embedding_model
        self._rerank_model = rerank_model
        self._timeout = timeout_seconds
        self._base_url = "https://api.voyageai.com/v1"

    async def embed(self, texts: list[str], input_type: str | None = None) -> list[list[float]]:
        if not self._api_key:
            return []
        payload: dict[str, Any] = {"model": self._embedding_model, "input": texts}
        if input_type:
            payload["input_type"] = input_type
        data = await self._post("/embeddings", payload)
        return [item["embedding"] for item in data.get("data", [])]

    async def rerank(self, query: str, documents: list[str], top_k: int) -> list[RerankResult]:
        if not self._api_key or not documents:
            return [RerankResult(index=index, relevance_score=1.0) for index in range(min(top_k, len(documents)))]
        payload: dict[str, Any] = {
            "model": self._rerank_model,
            "query": query,
            "documents": documents,
            "top_k": top_k,
        }
        data = await self._post("/rerank", payload)
        items = data.get("results", data.get("data", []))
        return [
            RerankResult(index=int(item["index"]), relevance_score=float(item["relevance_score"]))
            for item in items
        ]

    async def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        headers = {"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(f"{self._base_url}{path}", json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
