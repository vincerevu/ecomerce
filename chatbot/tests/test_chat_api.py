import httpx
import pytest

from app.api.dependencies import get_chat_service
from app.main import create_app
from app.schemas.chat import ChatRequest, ChatResponse


class FakeChatService:
    async def answer(self, request: ChatRequest, authorization: str | None = None) -> ChatResponse:
        assert authorization == "Bearer token"
        return ChatResponse(
            conversationId=request.conversation_id or "conv_test",
            answer=f"Đã nhận: {request.message}",
            suggestedProducts=[],
            model="fake-model",
        )

    async def stream_answer(self, request: ChatRequest, authorization: str | None = None):
        assert authorization == "Bearer token"
        yield {"type": "status", "conversationId": "conv_1", "message": "Đang soạn câu trả lời..."}
        yield {"type": "delta", "conversationId": "conv_1", "text": "Xin chào", "model": "fake-model"}
        yield {"type": "done", "conversationId": "conv_1", "suggestedProducts": [], "model": "fake-model"}


@pytest.mark.asyncio
async def test_chat_messages_endpoint_returns_answer() -> None:
    app = create_app()
    app.dependency_overrides[get_chat_service] = lambda: FakeChatService()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/chat/messages",
            json={"message": "Tư vấn áo khoác", "conversationId": "conv_1"},
            headers={"Authorization": "Bearer token"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "conversationId": "conv_1",
        "answer": "Đã nhận: Tư vấn áo khoác",
        "suggestedProducts": [],
        "model": "fake-model",
    }


@pytest.mark.asyncio
async def test_chat_stream_endpoint_returns_sse_events() -> None:
    app = create_app()
    app.dependency_overrides[get_chat_service] = lambda: FakeChatService()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/chat/stream",
            json={"message": "Xin chào"},
            headers={"Authorization": "Bearer token"},
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert '"type": "status"' in response.text
    assert '"text": "Xin chào"' in response.text
