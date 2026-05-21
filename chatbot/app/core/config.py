from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ecommerce-chatbot"
    environment: str = "development"
    chatbot_cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    ecommerce_api_base_url: str = "http://localhost:8888/api/v1"
    ecommerce_api_timeout_seconds: float = 10

    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_api_key: str = ""
    nvidia_llm_models: str = (
        "mistralai/mistral-nemotron,"
        "meta/llama-4-maverick-17b-128e-instruct,"
        "stepfun-ai/step-3.5-flash,"
        "minimaxai/minimax-m2.7,"
        "google/gemma-3n-e2b-it"
    )
    nvidia_timeout_seconds: float = 30
    nvidia_max_retries_per_model: int = 1
    nvidia_embedding_model: str = "nvidia/llama-nemotron-embed-1b-v2"
    nvidia_rerank_model: str = "nvidia/llama-nemotron-rerank-1b-v2"
    nvidia_rerank_url: str = "https://ai.api.nvidia.com/v1/retrieval/nvidia/llama-nemotron-rerank-1b-v2/reranking"

    voyage_api_key: str = ""
    voyage_embedding_model: str = "voyage-3"
    voyage_rerank_model: str = "rerank-2-lite"
    retrieval_provider: str = "nvidia"
    rerank_enabled: bool = True

    sqlite_path: str = "./data/chatbot.sqlite3"
    chroma_persist_dir: str = "./data/chroma"
    chroma_collection: str = "bagy_documents"
    redis_url: str = "redis://localhost:6379/1"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.chatbot_cors_origins.split(",") if origin.strip()]

    @property
    def llm_models(self) -> list[str]:
        return [model.strip() for model in self.nvidia_llm_models.split(",") if model.strip()]

    @property
    def provider_collection_name(self) -> str:
        provider = self.retrieval_provider.strip().lower()
        if provider == "voyage":
            return self.chroma_collection
        return f"{self.chroma_collection}_{provider}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
