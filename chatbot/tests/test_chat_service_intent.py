from app.services.chat_service import ChatService
from app.services.vector_store import RetrievalDocument


def test_size_questions_do_not_show_product_suggestions() -> None:
    assert ChatService._should_show_product_suggestions("Tôi cao 1m70 thì chọn size áo nào?") is False


def test_product_questions_show_product_suggestions() -> None:
    assert ChatService._should_show_product_suggestions("Tư vấn áo sơ mi nam dễ mặc") is True


def test_support_questions_prefer_knowledge_documents() -> None:
    product_doc = RetrievalDocument(
        id="product:1",
        content="Áo sơ mi",
        metadata={"sourceType": "product"},
        score=0.9,
    )
    knowledge_doc = RetrievalDocument(
        id="knowledge:size-guide",
        content="Hướng dẫn chọn size",
        metadata={"sourceType": "knowledge"},
        score=0.8,
    )

    documents = ChatService._documents_for_intent("chọn size áo thế nào", [product_doc, knowledge_doc])

    assert documents == [knowledge_doc]


def test_support_questions_fallback_to_default_knowledge_when_retrieval_misses() -> None:
    product_doc = RetrievalDocument(
        id="product:1",
        content="Áo sơ mi",
        metadata={"sourceType": "product"},
        score=0.9,
    )

    documents = ChatService._documents_for_intent("chính sách đổi trả", [product_doc])

    assert len(documents) == 1
    assert documents[0].metadata["sourceType"] == "knowledge"
    assert documents[0].metadata["topic"] == "return_policy"
