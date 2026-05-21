from app.services.ecommerce_client import ProductColor, ProductDetail, ProductSummary, ProductVariant
from app.services.indexing import build_product_document


def test_build_product_document_contains_searchable_product_fields() -> None:
    product = ProductSummary(
        id="product-1",
        name="Áo khoác gió Basic",
        slug="ao-khoac-gio-basic",
        short_description="Áo khoác nhẹ chống nắng",
        price=399000,
        thumbnail_url="/image.png",
        total_stock=12,
    )

    document = build_product_document(product)

    assert "Áo khoác gió Basic" in document
    assert "ao-khoac-gio-basic" in document
    assert "399000" in document
    assert "còn hàng" in document


def test_build_product_document_uses_detail_fields_for_rag() -> None:
    product = ProductDetail(
        id="product-1",
        name="Áo chống nắng nữ",
        slug="ao-chong-nang-nu",
        short_description="Áo chống UV UPF 50+",
        description="Phù hợp đi nắng mùa hè, chất vải mát.",
        material="Polyester",
        gender="Nữ",
        style="Casual",
        status="ACTIVE",
        category_name="Áo chống nắng",
        category_slug="ao-chong-nang",
        tags=("chống UV", "mùa hè"),
        colors=(
            ProductColor(
                id="color-1",
                color_name="Hồng",
                hex_code="#ffc0cb",
                image_urls=("https://example.com/image.webp",),
                variants=(
                    ProductVariant(
                        id="variant-1",
                        size_name="M",
                        original_price=499000,
                        sale_price=399000,
                        stock_quantity=5,
                    ),
                ),
            ),
        ),
        thumbnail_url="https://example.com/image.webp",
    )

    document = build_product_document(product)

    assert "Danh mục: Áo chống nắng" in document
    assert "Tags: chống UV, mùa hè" in document
    assert "Giới tính: Nữ" in document
    assert "Chất liệu: Polyester" in document
    assert "Màu sắc: Hồng" in document
    assert "Size: M" in document
    assert "Giá thấp nhất: 399000" in document
    assert "Mô tả chi tiết: Phù hợp đi nắng mùa hè" in document
