from app.services.vector_store import ChromaVectorStore

import pytest


def test_chroma_metadata_drops_none_and_stringifies_complex_values() -> None:
    metadata = ChromaVectorStore._clean_metadata(
        {
            "name": "Áo khoác",
            "price": 399000,
            "missing": None,
            "tags": ["nam", "basic"],
        }
    )

    assert metadata == {
        "name": "Áo khoác",
        "price": 399000,
        "tags": "['nam', 'basic']",
    }


@pytest.mark.asyncio
async def test_chroma_vector_store_upserts_and_searches(tmp_path) -> None:
    store = ChromaVectorStore(str(tmp_path / "chroma"), collection_name="test_documents")

    await store.upsert(
        ids=["doc-1", "doc-2"],
        contents=["áo khoác gió chống nắng", "quần jeans xanh"],
        metadatas=[{"name": "Áo khoác"}, {"name": "Quần jeans"}],
        embeddings=[[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]],
    )

    results = await store.search([1.0, 0.0, 0.0], limit=1)

    assert results[0].id == "doc-1"
    assert results[0].content == "áo khoác gió chống nắng"
    assert results[0].metadata["name"] == "Áo khoác"
