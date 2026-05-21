import hashlib
from dataclasses import dataclass
from typing import Any

from app.services.retrieval import RetrievalClient
from app.services.vector_store import DocumentIndex


@dataclass(frozen=True)
class KnowledgeDocument:
    id: str
    title: str
    topic: str
    content: str


DEFAULT_KNOWLEDGE_DOCUMENTS = [
    KnowledgeDocument(
        id="knowledge:size-guide",
        title="Hướng dẫn chọn size",
        topic="size_guide",
        content=(
            "Hướng dẫn chọn size quần áo Bagy/YODY.\n"
            "Cách chọn nhanh: hãy dựa trên số đo cơ thể và form sản phẩm thay vì chỉ nhìn chiều cao/cân nặng.\n"
            "Áo: đo vòng ngực tại phần lớn nhất, vòng eo tự nhiên và chiều dài áo đang mặc vừa. "
            "Nếu số đo nằm giữa hai size, nên chọn size lớn hơn để mặc thoải mái.\n"
            "Quần: đo vòng eo, vòng mông và chiều dài quần. Với quần co giãn có thể chọn đúng size; "
            "với dáng ôm hoặc chất vải ít co giãn nên tăng một size nếu thích thoải mái.\n"
            "Gợi ý theo form: slim fit/ôm nên cân nhắc tăng một size nếu không thích bó; regular fit chọn đúng size; "
            "oversize có thể chọn đúng size để rộng vừa hoặc giảm một size nếu muốn gọn hơn.\n"
            "Khi mua cho người khác: ưu tiên hỏi chiều cao, cân nặng, vòng ngực/eo/mông và thói quen mặc ôm hay rộng.\n"
            "Nếu vẫn phân vân, hãy cung cấp chiều cao, cân nặng, giới tính, sản phẩm muốn mua và kiểu mặc mong muốn để được tư vấn."
        ),
    ),
    KnowledgeDocument(
        id="knowledge:return-policy",
        title="Chính sách đổi trả",
        topic="return_policy",
        content=(
            "Chính sách đổi trả Bagy/YODY.\n"
            "Khách có thể yêu cầu đổi/trả khi sản phẩm còn nguyên tem mác, chưa qua sử dụng, chưa giặt tẩy, "
            "không bị bẩn, rách, ám mùi hoặc hư hỏng do quá trình sử dụng.\n"
            "Sản phẩm cần còn hóa đơn hoặc thông tin đơn hàng để đối chiếu.\n"
            "Các trường hợp thường được hỗ trợ: sai size, sai màu, lỗi sản xuất, giao nhầm sản phẩm hoặc sản phẩm không đúng mô tả.\n"
            "Với lỗi từ shop hoặc vận chuyển, khách nên chụp ảnh/video tình trạng sản phẩm và bao bì ngay khi nhận hàng để được hỗ trợ nhanh hơn.\n"
            "Một số mặt hàng đặc biệt, sản phẩm đã qua sử dụng, sản phẩm mất tem mác hoặc không còn điều kiện bán lại có thể không đủ điều kiện đổi/trả.\n"
            "Nếu muốn đổi size, hãy giữ sản phẩm nguyên trạng và liên hệ hỗ trợ kèm mã đơn hàng, sản phẩm cần đổi, size hiện tại và size muốn đổi.\n"
            "Thời gian, phí vận chuyển và phương thức hoàn tiền có thể phụ thuộc vào từng đơn hàng và chương trình bán hàng; "
            "nếu cần xử lý chính xác, khách nên cung cấp mã đơn hàng để nhân viên kiểm tra."
        ),
    ),
]


class KnowledgeIndexer:
    def __init__(
        self,
        retrieval_client: RetrievalClient,
        document_index: DocumentIndex,
        documents: list[KnowledgeDocument] | None = None,
    ) -> None:
        self._retrieval_client = retrieval_client
        self._document_index = document_index
        self._documents = documents or DEFAULT_KNOWLEDGE_DOCUMENTS

    async def sync(self) -> int:
        ids = [document.id for document in self._documents]
        contents = [self._format_document(document) for document in self._documents]
        hashes = [hashlib.sha256(content.encode("utf-8")).hexdigest() for content in contents]
        existing = await self._document_index.get_metadatas(ids)
        pending_indexes = [
            index for index, document_id in enumerate(ids) if existing.get(document_id, {}).get("contentHash") != hashes[index]
        ]
        if not pending_indexes:
            return 0

        pending_contents = [contents[index] for index in pending_indexes]
        embeddings = await self._retrieval_client.embed(pending_contents, input_type="document")
        if len(embeddings) != len(pending_indexes):
            raise RuntimeError("Embedding count did not match knowledge document count")

        await self._document_index.upsert(
            ids=[ids[index] for index in pending_indexes],
            contents=pending_contents,
            metadatas=[self._metadata(self._documents[index], hashes[index]) for index in pending_indexes],
            embeddings=embeddings,
        )
        return len(pending_indexes)

    @staticmethod
    def _format_document(document: KnowledgeDocument) -> str:
        return f"Tiêu đề: {document.title}\nChủ đề: {document.topic}\nNội dung:\n{document.content}"

    @staticmethod
    def _metadata(document: KnowledgeDocument, content_hash: str) -> dict[str, Any]:
        return {
            "sourceType": "knowledge",
            "source_id": document.id,
            "title": document.title,
            "topic": document.topic,
            "contentHash": content_hash,
        }
