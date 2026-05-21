import httpx
import pytest

from app.services.llm import NvidiaChatLLM


@pytest.mark.asyncio
async def test_nvidia_llm_falls_back_to_next_model() -> None:
    calls: list[str] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        payload = request.read()
        model = __import__("json").loads(payload)["model"]
        calls.append(model)
        if model == "primary":
            return httpx.Response(429, json={"error": "rate limited"})
        return httpx.Response(200, json={"choices": [{"message": {"content": "Xin chào từ fallback"}}]})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        llm = NvidiaChatLLM(
            api_key="test-key",
            base_url="https://integrate.api.nvidia.com/v1",
            models=["primary", "fallback"],
            client=client,
        )
        result = await llm.complete([{"role": "user", "content": "hello"}])

    assert result.model == "fallback"
    assert result.content == "Xin chào từ fallback"
    assert calls == ["primary", "fallback"]


@pytest.mark.asyncio
async def test_nvidia_llm_uses_dev_fallback_without_api_key() -> None:
    llm = NvidiaChatLLM(
        api_key="",
        base_url="https://integrate.api.nvidia.com/v1",
        models=["primary"],
    )

    result = await llm.complete([{"role": "user", "content": "hello"}])

    assert result.model == "dev-fallback"
    assert "NVIDIA_API_KEY" in result.content


@pytest.mark.asyncio
async def test_nvidia_llm_streams_from_fallback_model() -> None:
    calls: list[str] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        model = __import__("json").loads(request.read())["model"]
        calls.append(model)
        if model == "primary":
            return httpx.Response(429, json={"error": "rate limited"})
        body = "\n".join(
            [
                'data: {"choices":[{"delta":{"content":"Xin "}}]}',
                'data: {"choices":[{"delta":{"content":"chào"}}]}',
                "data: [DONE]",
            ]
        )
        return httpx.Response(200, text=body)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        llm = NvidiaChatLLM(
            api_key="test-key",
            base_url="https://integrate.api.nvidia.com/v1",
            models=["primary", "fallback"],
            client=client,
        )
        chunks = [chunk async for chunk in llm.stream([{"role": "user", "content": "hello"}])]

    assert [chunk.content for chunk in chunks] == ["Xin ", "chào"]
    assert [chunk.model for chunk in chunks] == ["fallback", "fallback"]
    assert calls == ["primary", "fallback"]
