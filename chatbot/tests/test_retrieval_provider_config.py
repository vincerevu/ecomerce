from app.core.config import Settings


def test_provider_collection_name_uses_nvidia_suffix_by_default() -> None:
    settings = Settings(chroma_collection="bagy_documents")

    assert settings.provider_collection_name == "bagy_documents_nvidia"


def test_provider_collection_name_suffixes_nvidia_collection() -> None:
    settings = Settings(retrieval_provider="nvidia", chroma_collection="bagy_documents")

    assert settings.provider_collection_name == "bagy_documents_nvidia"
