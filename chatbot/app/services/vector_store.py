import asyncio
from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class RetrievalDocument:
    id: str
    content: str
    metadata: dict
    score: float


class VectorStore(Protocol):
    async def search(self, embedding: list[float], limit: int = 20) -> list[RetrievalDocument]:
        raise NotImplementedError


class DocumentIndex(Protocol):
    async def get_metadatas(self, ids: list[str]) -> dict[str, dict[str, Any]]:
        raise NotImplementedError

    async def upsert(
        self,
        ids: list[str],
        contents: list[str],
        metadatas: list[dict[str, Any]],
        embeddings: list[list[float]],
    ) -> None:
        raise NotImplementedError


class ChromaVectorStore:
    def __init__(self, persist_dir: str, collection_name: str = "bagy_documents") -> None:
        import chromadb

        self._client = chromadb.PersistentClient(path=persist_dir)
        self._collection = self._client.get_or_create_collection(name=collection_name)

    async def search(self, embedding: list[float], limit: int = 20) -> list[RetrievalDocument]:
        if not embedding:
            return []

        result = await asyncio.to_thread(
            self._collection.query,
            query_embeddings=[embedding],
            n_results=limit,
            include=["documents", "metadatas", "distances"],
        )
        ids = result.get("ids", [[]])[0]
        documents = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]

        return [
            RetrievalDocument(
                id=str(document_id),
                content=str(content),
                metadata=dict(metadata or {}),
                score=1 / (1 + float(distance or 0)),
            )
            for document_id, content, metadata, distance in zip(ids, documents, metadatas, distances, strict=False)
        ]

    async def get_metadatas(self, ids: list[str]) -> dict[str, dict[str, Any]]:
        if not ids:
            return {}
        result = await asyncio.to_thread(self._collection.get, ids=ids, include=["metadatas"])
        result_ids = result.get("ids", [])
        metadatas = result.get("metadatas", [])
        return {str(document_id): dict(metadata or {}) for document_id, metadata in zip(result_ids, metadatas, strict=False)}

    async def upsert(
        self,
        ids: list[str],
        contents: list[str],
        metadatas: list[dict[str, Any]],
        embeddings: list[list[float]],
    ) -> None:
        if not ids:
            return
        await asyncio.to_thread(
            self._collection.upsert,
            ids=ids,
            documents=contents,
            metadatas=[self._clean_metadata(metadata) for metadata in metadatas],
            embeddings=embeddings,
        )

    @staticmethod
    def _clean_metadata(metadata: dict[str, Any]) -> dict[str, str | int | float | bool]:
        clean: dict[str, str | int | float | bool] = {}
        for key, value in metadata.items():
            if value is None:
                continue
            if isinstance(value, (str, int, float, bool)):
                clean[key] = value
            else:
                clean[key] = str(value)
        return clean
