# Ecommerce Chatbot Service

FastAPI service for the storefront chatbot. It uses NVIDIA NIM for chat generation, NVIDIA embeddings/reranking, ChromaDB for local vector search, and SQLite for chat history.

## Run

```bash
cd chatbot
pip install -e ".[test]"
uvicorn app.main:create_app --factory --reload --port 8000
```

## Important Environment Variables

```env
NVIDIA_API_KEY=...
NVIDIA_LLM_MODELS=mistralai/mistral-nemotron,meta/llama-4-maverick-17b-128e-instruct,stepfun-ai/step-3.5-flash,minimaxai/minimax-m2.7,google/gemma-3n-e2b-it
NVIDIA_EMBEDDING_MODEL=nvidia/llama-nemotron-embed-1b-v2
NVIDIA_RERANK_MODEL=nvidia/llama-nemotron-rerank-1b-v2
NVIDIA_RERANK_URL=https://ai.api.nvidia.com/v1/retrieval/nvidia/llama-nemotron-rerank-1b-v2/reranking
RETRIEVAL_PROVIDER=nvidia
ECOMMERCE_API_BASE_URL=http://localhost:8888/api/v1
SQLITE_PATH=./data/chatbot.sqlite3
CHROMA_PERSIST_DIR=./data/chroma
CHROMA_COLLECTION=bagy_documents
```

## API

- `GET /health`
- `POST /api/v1/chat/messages`

## RAG Index

Sync products from Spring Boot:

```bash
python -m app.jobs.sync_products
```

Sync static knowledge documents such as size guide and return policy:

```bash
python -m app.jobs.sync_knowledge
```

ChromaDB persists vectors in `CHROMA_PERSIST_DIR`. SQLite creates its tables automatically at `SQLITE_PATH`.

For rate limits, sync in smaller chunks:

```bash
SYNC_BATCH_SIZE=4 SYNC_MAX_PRODUCTS=100 python -m app.jobs.sync_products
```

Resume from a later Spring product page:

```bash
SYNC_START_PAGE=25 SYNC_BATCH_SIZE=4 SYNC_MAX_PRODUCTS=100 python -m app.jobs.sync_products
```
