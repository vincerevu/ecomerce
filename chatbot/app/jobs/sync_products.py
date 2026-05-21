import asyncio
import os

from app.api.dependencies import build_retrieval_client
from app.core.config import get_settings
from app.services.ecommerce_client import EcommerceClient
from app.services.indexing import ProductIndexer
from app.services.vector_store import ChromaVectorStore


async def main() -> None:
    settings = get_settings()
    indexer = ProductIndexer(
        ecommerce_client=EcommerceClient(
            base_url=settings.ecommerce_api_base_url,
            timeout_seconds=settings.ecommerce_api_timeout_seconds,
        ),
        retrieval_client=build_retrieval_client(settings),
        document_index=ChromaVectorStore(
            persist_dir=settings.chroma_persist_dir,
            collection_name=settings.provider_collection_name,
        ),
        batch_size=int(os.getenv("SYNC_BATCH_SIZE", "8")),
        start_page=int(os.getenv("SYNC_START_PAGE", "0")),
        max_products=int(os.getenv("SYNC_MAX_PRODUCTS")) if os.getenv("SYNC_MAX_PRODUCTS") else None,
    )
    synced = await indexer.sync_products()
    print(f"Synced {synced} products")


if __name__ == "__main__":
    asyncio.run(main())
