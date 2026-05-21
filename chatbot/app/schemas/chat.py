from typing import Literal

from pydantic import BaseModel, Field


class ChatContext(BaseModel):
    page: str | None = None
    product_slug: str | None = Field(default=None, alias="productSlug")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: str | None = Field(default=None, alias="conversationId")
    context: ChatContext | None = None
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)


class SuggestedProduct(BaseModel):
    id: str
    name: str
    slug: str | None = None
    price: float | None = None
    thumbnail_url: str | None = Field(default=None, alias="thumbnailUrl")
    total_stock: int | None = Field(default=None, alias="totalStock")
    category: str | None = None


class ChatResponse(BaseModel):
    conversation_id: str = Field(alias="conversationId")
    answer: str
    suggested_products: list[SuggestedProduct] = Field(default_factory=list, alias="suggestedProducts")
    model: str | None = None
