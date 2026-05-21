import asyncio

from app.api.dependencies import build_retrieval_client
from app.core.config import get_settings
from app.services.knowledge import KnowledgeIndexer
from app.services.vector_store import ChromaVectorStore


async def main() -> None:
    settings = get_settings()
    indexer = KnowledgeIndexer(
        retrieval_client=build_retrieval_client(settings),
        document_index=ChromaVectorStore(
            persist_dir=settings.chroma_persist_dir,
            collection_name=settings.provider_collection_name,
        ),
    )
    synced = await indexer.sync()
    print(f"Synced {synced} knowledge documents")


if __name__ == "__main__":
    asyncio.run(main())
