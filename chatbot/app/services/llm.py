import json
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any, Protocol

import httpx


class LLMError(RuntimeError):
    pass


@dataclass(frozen=True)
class LLMResult:
    content: str
    model: str


class ChatLLM(Protocol):
    async def complete(self, messages: list[dict[str, str]]) -> LLMResult:
        raise NotImplementedError

    async def stream(self, messages: list[dict[str, str]]) -> AsyncIterator[LLMResult]:
        raise NotImplementedError


class NvidiaChatLLM:
    def __init__(
        self,
        api_key: str,
        base_url: str,
        models: list[str],
        timeout_seconds: float = 30,
        max_retries_per_model: int = 1,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._models = models
        self._timeout = timeout_seconds
        self._max_retries_per_model = max(1, max_retries_per_model)
        self._client = client

    async def complete(self, messages: list[dict[str, str]]) -> LLMResult:
        if not self._api_key:
            return LLMResult(
                content="Mình đã nhận được câu hỏi. Hiện chatbot chưa cấu hình NVIDIA_API_KEY nên chỉ có thể phản hồi ở chế độ thử nghiệm.",
                model="dev-fallback",
            )

        last_error: Exception | None = None
        for model in self._models:
            for _ in range(self._max_retries_per_model):
                try:
                    content = await self._call_model(model, messages)
                    if content.strip():
                        return LLMResult(content=content.strip(), model=model)
                except (httpx.HTTPError, LLMError) as exc:
                    last_error = exc
                    continue

        return LLMResult(
            content="Mình đã nhận được câu hỏi. Tuy nhiên, kết nối đến trợ lý AI (NVIDIA API Key) đang bị lỗi (403 Forbidden hoặc hết hạn). Vui lòng kiểm tra hoặc cấu hình lại API Key hợp lệ trên VM.",
            model="error-fallback",
        )

    async def stream(self, messages: list[dict[str, str]]) -> AsyncIterator[LLMResult]:
        if not self._api_key:
            fallback = (
                "Mình đã nhận được câu hỏi. Hiện chatbot chưa cấu hình NVIDIA_API_KEY nên chỉ có thể phản hồi "
                "ở chế độ thử nghiệm."
            )
            for token in fallback.split(" "):
                yield LLMResult(content=f"{token} ", model="dev-fallback")
            return

        last_error: Exception | None = None
        for model in self._models:
            for _ in range(self._max_retries_per_model):
                emitted = False
                try:
                    async for token in self._stream_model(model, messages):
                        emitted = True
                        yield LLMResult(content=token, model=model)
                    return
                except (httpx.HTTPError, LLMError) as exc:
                    last_error = exc
                    if emitted:
                        raise LLMError(f"{model} stream failed after emitting content: {exc}") from exc
                    continue

        fallback = (
            "Mình đã nhận được câu hỏi. Tuy nhiên, kết nối đến trợ lý AI (NVIDIA API Key) đang bị lỗi "
            "(403 Forbidden hoặc hết hạn). Vui lòng kiểm tra hoặc cấu hình lại API Key hợp lệ trên VM."
        )
        for token in fallback.split(" "):
            yield LLMResult(content=f"{token} ", model="error-fallback")

    async def _call_model(self, model: str, messages: list[dict[str, str]]) -> str:
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 700,
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        if self._client is not None:
            response = await self._client.post(f"{self._base_url}/chat/completions", json=payload, headers=headers)
        else:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(f"{self._base_url}/chat/completions", json=payload, headers=headers)

        if response.status_code >= 500 or response.status_code in {408, 409, 429}:
            raise LLMError(f"{model} returned retryable status {response.status_code}")
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def _stream_model(self, model: str, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 700,
            "stream": True,
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        if self._client is not None:
            response = await self._client.post(f"{self._base_url}/chat/completions", json=payload, headers=headers)
            if response.status_code >= 500 or response.status_code in {408, 409, 429}:
                raise LLMError(f"{model} returned retryable status {response.status_code}")
            response.raise_for_status()
            for line in response.text.splitlines():
                token = self._parse_sse_line(line)
                if token:
                    yield token
            return

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            async with client.stream(
                "POST",
                f"{self._base_url}/chat/completions",
                json=payload,
                headers=headers,
            ) as response:
                if response.status_code >= 500 or response.status_code in {408, 409, 429}:
                    raise LLMError(f"{model} returned retryable status {response.status_code}")
                response.raise_for_status()
                async for line in response.aiter_lines():
                    token = self._parse_sse_line(line)
                    if token:
                        yield token

    @staticmethod
    def _parse_sse_line(line: str) -> str:
        if not line.startswith("data:"):
            return ""
        raw_data = line.removeprefix("data:").strip()
        if not raw_data or raw_data == "[DONE]":
            return ""
        data = json.loads(raw_data)
        return data.get("choices", [{}])[0].get("delta", {}).get("content", "")
