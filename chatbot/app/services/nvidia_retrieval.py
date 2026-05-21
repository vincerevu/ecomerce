from dataclasses import dataclass
from typing import Any

import httpx

from app.services.voyage import RerankResult


@dataclass(frozen=True)
class NvidiaRetrievalConfig:
    api_key: str
    base_url: str
    embedding_model: str
    rerank_model: str
    rerank_url: str | None = None
    timeout_seconds: float = 30


class NvidiaRetrievalClient:
    def __init__(self, config: NvidiaRetrievalConfig, client: httpx.AsyncClient | None = None) -> None:
        self._config = config
        self._client = client

    async def embed(self, texts: list[str], input_type: str | None = None) -> list[list[float]]:
        if not self._config.api_key:
            return []
        payload: dict[str, Any] = {
            "model": self._config.embedding_model,
            "input": texts,
            "input_type": "query" if input_type == "query" else "passage",
            "truncate": "END",
        }
        data = await self._post("/embeddings", payload)
        return [item["embedding"] for item in data.get("data", [])]

    async def rerank(self, query: str, documents: list[str], top_k: int) -> list[RerankResult]:
        if not self._config.api_key or not documents:
            return [RerankResult(index=index, relevance_score=1.0) for index in range(min(top_k, len(documents)))]
        payload: dict[str, Any] = {
            "model": self._config.rerank_model,
            "query": {"text": query},
            "passages": [{"text": document} for document in documents],
            "truncate": "END",
        }
        data = await self._post(self._rerank_path_or_url(), payload)
        rankings = data.get("rankings", data.get("results", []))
        return [
            RerankResult(
                index=int(item.get("index", item.get("passage_index", 0))),
                relevance_score=float(item.get("logit", item.get("relevance_score", item.get("score", 0)))),
            )
            for item in rankings[:top_k]
        ]

    def _rerank_path_or_url(self) -> str:
        if self._config.rerank_url:
            return self._config.rerank_url
        return "/ranking"

    def _url_for(self, path_or_url: str) -> str:
        if path_or_url.startswith(("http://", "https://")):
            return path_or_url
        return f"{self._config.base_url.rstrip('/')}{path_or_url}"

    async def _post(self, path_or_url: str, payload: dict[str, Any]) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self._config.api_key}",
            "Content-Type": "application/json",
        }
        url = self._url_for(path_or_url)
        if self._client is not None:
            response = await self._client.post(url, json=payload, headers=headers)
        else:
            async with httpx.AsyncClient(timeout=self._config.timeout_seconds) as client:
                response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
