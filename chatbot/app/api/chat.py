import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_chat_service
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


@router.post("/messages", response_model=ChatResponse)
async def create_message(
    request: ChatRequest,
    authorization: str | None = Header(default=None),
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatResponse:
    return await chat_service.answer(request, authorization=authorization)


@router.post("/stream")
async def stream_message(
    request: ChatRequest,
    authorization: str | None = Header(default=None),
    chat_service: ChatService = Depends(get_chat_service),
) -> StreamingResponse:
    async def event_stream() -> AsyncIterator[str]:
        try:
            async for event in chat_service.stream_answer(request, authorization=authorization):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except Exception as e:
            import traceback
            traceback.print_exc()
            error = {
                "type": "error",
                "message": "Xin lỗi, hiện mình chưa kết nối được trợ lý tư vấn. Bạn thử lại sau ít phút nhé.",
            }
            yield f"data: {json.dumps(error, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
