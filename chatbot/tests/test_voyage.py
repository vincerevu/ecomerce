import pytest

from app.services.voyage import VoyageClient


@pytest.mark.asyncio
async def test_voyage_rerank_accepts_results_response_shape(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_post(self, path: str, payload: dict) -> dict:
        return {"results": [{"index": 2, "relevance_score": 0.9}]}

    monkeypatch.setattr(VoyageClient, "_post", fake_post)
    client = VoyageClient(api_key="key", embedding_model="voyage-3", rerank_model="rerank-2-lite")

    results = await client.rerank("query", ["a", "b", "c"], top_k=1)

    assert results[0].index == 2
    assert results[0].relevance_score == 0.9


@pytest.mark.asyncio
async def test_voyage_embed_sends_input_type(monkeypatch: pytest.MonkeyPatch) -> None:
    captured_payload = {}

    async def fake_post(self, path: str, payload: dict) -> dict:
        captured_payload.update(payload)
        return {"data": [{"embedding": [0.1, 0.2]}]}

    monkeypatch.setattr(VoyageClient, "_post", fake_post)
    client = VoyageClient(api_key="key", embedding_model="voyage-3", rerank_model="rerank-2-lite")

    embeddings = await client.embed(["áo khoác"], input_type="query")

    assert embeddings == [[0.1, 0.2]]
    assert captured_payload["input_type"] == "query"
