import httpx
import pytest

from app.services.nvidia_retrieval import NvidiaRetrievalClient, NvidiaRetrievalConfig


@pytest.mark.asyncio
async def test_nvidia_retrieval_embed_calls_openai_compatible_embeddings_endpoint() -> None:
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["payload"] = __import__("json").loads(request.read())
        return httpx.Response(200, json={"data": [{"embedding": [0.1, 0.2]}]})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        retrieval = NvidiaRetrievalClient(
            NvidiaRetrievalConfig(
                api_key="key",
                base_url="https://integrate.api.nvidia.com/v1",
                embedding_model="nvidia/llama-3.2-nv-embedqa-1b-v2",
                rerank_model="nvidia/llama-3.2-nv-rerankqa-1b-v2",
            ),
            client=client,
        )
        embeddings = await retrieval.embed(["áo khoác"], input_type="document")

    assert embeddings == [[0.1, 0.2]]
    assert captured["url"] == "https://integrate.api.nvidia.com/v1/embeddings"
    assert captured["payload"]["input_type"] == "passage"


@pytest.mark.asyncio
async def test_nvidia_retrieval_rerank_parses_rankings() -> None:
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        return httpx.Response(200, json={"rankings": [{"index": 1, "logit": 9.5}]})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        retrieval = NvidiaRetrievalClient(
            NvidiaRetrievalConfig(
                api_key="key",
                base_url="https://integrate.api.nvidia.com/v1",
                embedding_model="nvidia/llama-3.2-nv-embedqa-1b-v2",
                rerank_model="nvidia/llama-3.2-nv-rerankqa-1b-v2",
                rerank_url="https://ai.api.nvidia.com/v1/retrieval/nvidia/llama-nemotron-rerank-1b-v2/reranking",
            ),
            client=client,
        )
        results = await retrieval.rerank("áo khoác", ["a", "b"], top_k=1)

    assert results[0].index == 1
    assert results[0].relevance_score == 9.5
    assert captured["url"] == "https://ai.api.nvidia.com/v1/retrieval/nvidia/llama-nemotron-rerank-1b-v2/reranking"


@pytest.mark.asyncio
async def test_nvidia_retrieval_rerank_defaults_to_local_nim_ranking_path() -> None:
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        return httpx.Response(200, json={"rankings": []})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        retrieval = NvidiaRetrievalClient(
            NvidiaRetrievalConfig(
                api_key="key",
                base_url="http://localhost:8000/v1",
                embedding_model="nvidia/llama-nemotron-embed-1b-v2",
                rerank_model="nvidia/llama-nemotron-rerank-1b-v2",
            ),
            client=client,
        )
        await retrieval.rerank("áo khoác", ["a"], top_k=1)

    assert captured["url"] == "http://localhost:8000/v1/ranking"
