import pytest

from app.services.knowledge import KnowledgeDocument, KnowledgeIndexer


class FakeRetrievalClient:
    def __init__(self) -> None:
        self.calls = 0

    async def embed(self, texts: list[str], input_type: str | None = None):
        self.calls += 1
        assert input_type == "document"
        return [[0.1, 0.2] for _ in texts]


class CapturingIndex:
    def __init__(self, existing=None) -> None:
        self.existing = existing or {}
        self.ids: list[str] = []
        self.metadatas = []

    async def get_metadatas(self, ids):
        return self.existing

    async def upsert(self, ids, contents, metadatas, embeddings) -> None:
        self.ids.extend(ids)
        self.metadatas.extend(metadatas)


@pytest.mark.asyncio
async def test_knowledge_indexer_upserts_size_and_policy_docs() -> None:
    retrieval = FakeRetrievalClient()
    index = CapturingIndex()
    indexer = KnowledgeIndexer(retrieval, index)

    synced = await indexer.sync()

    assert synced == 2
    assert index.ids == ["knowledge:size-guide", "knowledge:return-policy"]
    assert {metadata["topic"] for metadata in index.metadatas} == {"size_guide", "return_policy"}
    assert all(metadata["sourceType"] == "knowledge" for metadata in index.metadatas)


@pytest.mark.asyncio
async def test_knowledge_indexer_skips_unchanged_docs() -> None:
    document = KnowledgeDocument(
        id="knowledge:test",
        title="Test",
        topic="test",
        content="Nội dung",
    )
    content = KnowledgeIndexer._format_document(document)
    import hashlib

    content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
    retrieval = FakeRetrievalClient()
    index = CapturingIndex(existing={"knowledge:test": {"contentHash": content_hash}})
    indexer = KnowledgeIndexer(retrieval, index, documents=[document])

    synced = await indexer.sync()

    assert synced == 0
    assert retrieval.calls == 0
    assert index.ids == []
