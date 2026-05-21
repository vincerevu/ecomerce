from threading import Lock

from app.core.config import Settings, get_settings
from app.services.chat_service import ChatService
from app.services.conversation_store import SQLiteConversationStore
from app.services.ecommerce_client import EcommerceClient
from app.services.llm import NvidiaChatLLM
from app.services.nvidia_retrieval import NvidiaRetrievalClient, NvidiaRetrievalConfig
from app.services.retrieval import RetrievalService
from app.services.vector_store import ChromaVectorStore
from app.services.voyage import VoyageClient


_chat_service_lock = Lock()
_chat_service: ChatService | None = None


def build_retrieval_client(settings: Settings):
    if settings.retrieval_provider.strip().lower() == "nvidia":
        return NvidiaRetrievalClient(
            NvidiaRetrievalConfig(
                api_key=settings.nvidia_api_key,
                base_url=settings.nvidia_base_url,
                embedding_model=settings.nvidia_embedding_model,
                rerank_model=settings.nvidia_rerank_model,
                rerank_url=settings.nvidia_rerank_url,
                timeout_seconds=settings.nvidia_timeout_seconds,
            )
        )
    return VoyageClient(
        api_key=settings.voyage_api_key,
        embedding_model=settings.voyage_embedding_model,
        rerank_model=settings.voyage_rerank_model,
    )


def get_chat_service() -> ChatService:
    global _chat_service
    if _chat_service is not None:
        return _chat_service
    with _chat_service_lock:
        if _chat_service is not None:
            return _chat_service
        _chat_service = _build_chat_service()
        return _chat_service


def _build_chat_service() -> ChatService:
    settings: Settings = get_settings()
    llm = NvidiaChatLLM(
        api_key=settings.nvidia_api_key,
        base_url=settings.nvidia_base_url,
        models=settings.llm_models,
        timeout_seconds=settings.nvidia_timeout_seconds,
        max_retries_per_model=settings.nvidia_max_retries_per_model,
    )
    retrieval_client = build_retrieval_client(settings)
    vector_store = ChromaVectorStore(
        persist_dir=settings.chroma_persist_dir,
        collection_name=settings.provider_collection_name,
    )
    retrieval = RetrievalService(retrieval_client, vector_store, rerank_enabled=settings.rerank_enabled)
    ecommerce = EcommerceClient(
        base_url=settings.ecommerce_api_base_url,
        timeout_seconds=settings.ecommerce_api_timeout_seconds,
    )
    conversation_store = SQLiteConversationStore(settings.sqlite_path)
    return ChatService(
        llm=llm,
        retrieval_service=retrieval,
        ecommerce_client=ecommerce,
        conversation_store=conversation_store,
    )
