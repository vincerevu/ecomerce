import re
from uuid import uuid4
from collections.abc import AsyncIterator

from app.schemas.chat import ChatRequest, ChatResponse, SuggestedProduct
from app.services.conversation_store import SQLiteConversationStore
from app.services.ecommerce_client import EcommerceClient, ProductSummary
from app.services.knowledge import DEFAULT_KNOWLEDGE_DOCUMENTS, KnowledgeDocument
from app.services.llm import ChatLLM
from app.services.retrieval import RetrievalService
from app.services.vector_store import RetrievalDocument


SYSTEM_PROMPT = """Bạn là Bagy Support, chatbot tư vấn ecommerce bằng tiếng Việt.
Chỉ trả lời dựa trên dữ liệu sản phẩm/chính sách được cung cấp.
Nếu thiếu thông tin, hãy nói ngắn gọn rằng bạn chưa đủ dữ liệu và gợi ý người dùng cung cấp thêm nhu cầu.
Không bịa giá, tồn kho, chính sách hoặc trạng thái đơn hàng.
Khi tư vấn sản phẩm, trả lời ngắn 2-4 câu để định hướng lựa chọn; không liệt kê lại toàn bộ danh sách sản phẩm vì giao diện sẽ hiển thị card sản phẩm bên dưới.
Khi có sản phẩm phù hợp, tuyệt đối không viết danh sách đánh số hoặc bullet sản phẩm trong câu trả lời.
Không cần in đậm tên sản phẩm. Hãy nói một câu tóm tắt tiêu chí chọn, rồi nhắc người dùng bấm các card sản phẩm bên dưới để xem chi tiết.
Nếu câu hỏi là hướng dẫn chọn size, đổi trả, hoàn tiền hoặc chính sách hỗ trợ, chỉ trả lời chính sách/hướng dẫn; không nhắc card hoặc sản phẩm bên dưới."""


class ChatService:
    def __init__(
        self,
        llm: ChatLLM,
        retrieval_service: RetrievalService,
        ecommerce_client: EcommerceClient,
        conversation_store: SQLiteConversationStore | None = None,
    ) -> None:
        self._llm = llm
        self._retrieval = retrieval_service
        self._ecommerce = ecommerce_client
        self._conversation_store = conversation_store

    async def answer(self, request: ChatRequest, authorization: str | None = None) -> ChatResponse:
        conversation_id = request.conversation_id or f"conv_{uuid4().hex}"
        history = await self._get_history(request, conversation_id)
        documents = await self._retrieval.retrieve(request.message)
        documents = self._documents_for_intent(request.message, documents)
        products = await self._products_for_intent(request.message, authorization)
        messages = self._build_messages(request, history, documents, products)
        llm_result = await self._llm.complete(messages)
        suggestions = self._suggested_products(products, documents)
        answer = self._compact_answer_for_product_cards(llm_result.content, suggestions)
        await self._save_turn(conversation_id, request.message, answer)

        return ChatResponse(
            conversationId=conversation_id,
            answer=answer,
            suggestedProducts=suggestions,
            model=llm_result.model,
        )

    async def stream_answer(self, request: ChatRequest, authorization: str | None = None) -> AsyncIterator[dict]:
        conversation_id = request.conversation_id or f"conv_{uuid4().hex}"
        yield {"type": "status", "conversationId": conversation_id, "message": "Đang đọc nhu cầu của bạn..."}

        history = await self._get_history(request, conversation_id)
        yield {"type": "status", "conversationId": conversation_id, "message": "Đang tìm sản phẩm và thông tin phù hợp..."}

        documents = await self._retrieval.retrieve(request.message)
        documents = self._documents_for_intent(request.message, documents)
        products = await self._products_for_intent(request.message, authorization)
        messages = self._build_messages(request, history, documents, products)

        yield {"type": "status", "conversationId": conversation_id, "message": "Đang soạn câu trả lời..."}
        answer_parts: list[str] = []
        model: str | None = None
        async for chunk in self._llm.stream(messages):
            model = chunk.model
            answer_parts.append(chunk.content)
            yield {"type": "delta", "conversationId": conversation_id, "text": chunk.content, "model": chunk.model}

        answer = "".join(answer_parts).strip()
        await self._save_turn(conversation_id, request.message, answer)
        yield {
            "type": "done",
            "conversationId": conversation_id,
            "suggestedProducts": [
                product.model_dump(by_alias=True) for product in self._suggested_products(products, documents)
            ],
            "model": model,
        }

    async def _get_history(self, request: ChatRequest, conversation_id: str):
        if request.history:
            return request.history[-8:]
        if self._conversation_store is None or not request.conversation_id:
            return []
        return await self._conversation_store.get_recent(conversation_id, limit=8)

    async def _save_turn(self, conversation_id: str, user_message: str, assistant_message: str) -> None:
        if self._conversation_store is None:
            return
        await self._conversation_store.append(conversation_id, "user", user_message)
        await self._conversation_store.append(conversation_id, "assistant", assistant_message)

    async def _safe_search_products(self, message: str, authorization: str | None) -> list[ProductSummary]:
        try:
            return await self._ecommerce.search_products(message, bearer_token=authorization, size=6)
        except Exception:
            return []

    async def _products_for_intent(self, message: str, authorization: str | None) -> list[ProductSummary]:
        if not self._should_show_product_suggestions(message):
            return []
        return await self._safe_search_products(message, authorization)

    @classmethod
    def _documents_for_intent(cls, message: str, documents: list[RetrievalDocument]) -> list[RetrievalDocument]:
        if cls._is_support_knowledge_question(message):
            knowledge_documents = [
                document for document in documents if document.metadata.get("sourceType") == "knowledge"
            ]
            if knowledge_documents:
                return knowledge_documents
            return cls._default_knowledge_documents_for_message(message)
        return documents

    @classmethod
    def _should_show_product_suggestions(cls, message: str) -> bool:
        return not cls._is_support_knowledge_question(message)

    @staticmethod
    def _is_support_knowledge_question(message: str) -> bool:
        normalized = message.lower()
        support_keywords = (
            "chọn size",
            "chon size",
            "bảng size",
            "bang size",
            "size áo",
            "size quần",
            "size quan",
            "vừa size",
            "vua size",
            "đổi trả",
            "doi tra",
            "đổi size",
            "doi size",
            "trả hàng",
            "tra hang",
            "hoàn tiền",
            "hoan tien",
            "refund",
            "return",
        )
        return any(keyword in normalized for keyword in support_keywords)

    @classmethod
    def _default_knowledge_documents_for_message(cls, message: str) -> list[RetrievalDocument]:
        normalized = message.lower()
        topics: set[str] = set()
        if any(keyword in normalized for keyword in ("size", "kích thước", "kich thuoc", "vừa", "vua")):
            topics.add("size_guide")
        if any(
            keyword in normalized
            for keyword in ("đổi", "doi", "trả", "tra", "hoàn tiền", "hoan tien", "refund", "return")
        ):
            topics.add("return_policy")
        if not topics:
            topics = {"size_guide", "return_policy"}

        return [
            cls._knowledge_document_to_retrieval(document)
            for document in DEFAULT_KNOWLEDGE_DOCUMENTS
            if document.topic in topics
        ]

    @staticmethod
    def _knowledge_document_to_retrieval(document: KnowledgeDocument) -> RetrievalDocument:
        return RetrievalDocument(
            id=document.id,
            content=f"Tiêu đề: {document.title}\nChủ đề: {document.topic}\nNội dung:\n{document.content}",
            metadata={
                "sourceType": "knowledge",
                "source_id": document.id,
                "title": document.title,
                "topic": document.topic,
            },
            score=1.0,
        )

    def _build_messages(
        self,
        request: ChatRequest,
        history,
        documents: list[RetrievalDocument],
        products: list[ProductSummary],
    ) -> list[dict[str, str]]:
        context = self._format_context(documents, products)
        history_messages = [{"role": item.role, "content": item.content} for item in history[-8:]]
        return [
            {"role": "system", "content": SYSTEM_PROMPT},
            *history_messages,
            {
                "role": "user",
                "content": f"Câu hỏi: {request.message}\n\nNgữ cảnh truy xuất:\n{context}",
            },
        ]

    @staticmethod
    def _format_context(documents: list[RetrievalDocument], products: list[ProductSummary]) -> str:
        chunks = [f"- {document.content}" for document in documents]
        product_lines = [
            f"- Sản phẩm: {product.name}; slug={product.slug}; giá={product.price}; tồn kho={product.total_stock}; mô tả={product.short_description}"
            for product in products
        ]
        combined = chunks + product_lines
        return "\n".join(combined) if combined else "Không có dữ liệu liên quan."

    @staticmethod
    def _to_suggested_product(product: ProductSummary) -> SuggestedProduct:
        return SuggestedProduct(
            id=product.id,
            name=product.name,
            slug=product.slug,
            price=product.price,
            thumbnailUrl=product.thumbnail_url,
            totalStock=product.total_stock,
        )

    @classmethod
    def _suggested_products(
        cls,
        products: list[ProductSummary],
        documents: list[RetrievalDocument],
        limit: int = 4,
    ) -> list[SuggestedProduct]:
        suggestions: list[SuggestedProduct] = []
        seen: set[str] = set()

        for product in products:
            suggestion = cls._to_suggested_product(product)
            cls._append_suggestion(suggestions, seen, suggestion, limit)
            if len(suggestions) >= limit:
                return suggestions

        for document in documents:
            if document.metadata.get("sourceType") != "product":
                continue
            source_id = str(document.metadata.get("source_id") or document.id.replace("product:", ""))
            name = document.metadata.get("name")
            if not source_id or not name:
                continue
            suggestion = SuggestedProduct(
                id=source_id,
                name=str(name),
                slug=str(document.metadata["slug"]) if document.metadata.get("slug") else None,
                price=float(document.metadata["price"]) if document.metadata.get("price") is not None else None,
                thumbnailUrl=str(document.metadata["thumbnailUrl"])
                if document.metadata.get("thumbnailUrl")
                else None,
                totalStock=int(document.metadata["totalStock"])
                if document.metadata.get("totalStock") is not None
                else None,
                category=str(document.metadata["category"]) if document.metadata.get("category") else None,
            )
            cls._append_suggestion(suggestions, seen, suggestion, limit)
            if len(suggestions) >= limit:
                return suggestions

        return suggestions

    @staticmethod
    def _append_suggestion(
        suggestions: list[SuggestedProduct],
        seen: set[str],
        suggestion: SuggestedProduct,
        limit: int,
    ) -> None:
        key = suggestion.slug or suggestion.id
        if key in seen or len(suggestions) >= limit:
            return
        seen.add(key)
        suggestions.append(suggestion)

    @staticmethod
    def _compact_answer_for_product_cards(answer: str, suggestions: list[SuggestedProduct]) -> str:
        if not suggestions:
            return answer
        lines = [line.strip() for line in answer.splitlines() if line.strip()]
        has_product_list = any(re.match(r"^(-|\*|\d+[\.\)])\s+", line) for line in lines)
        if not has_product_list and len(lines) <= 3:
            return answer
        return (
            "Mình đã chọn vài sản phẩm phù hợp với nhu cầu của bạn. "
            "Bạn bấm vào các card bên dưới để xem ảnh, giá và chi tiết sản phẩm nhé."
        )
