from app.services.ecommerce_client import EcommerceClient


def test_build_keyword_filter_matches_spring_filter_syntax() -> None:
    filter_value = EcommerceClient._build_keyword_filter("áo khoác")

    assert "name~'áo khoác'" in filter_value
    assert "category.slug~'áo khoác'" in filter_value
    assert " or " in filter_value


def test_build_keyword_filter_escapes_single_quotes() -> None:
    filter_value = EcommerceClient._build_keyword_filter("men's jacket")

    assert "men\\'s jacket" in filter_value


def test_to_product_detail_parses_nested_colors_variants_and_tags() -> None:
    detail = EcommerceClient._to_product_detail(
        {
            "id": "product-1",
            "name": "Áo chống nắng nữ",
            "slug": "ao-chong-nang-nu",
            "shortDescription": "Áo chống UV",
            "description": "Mô tả dài",
            "material": "Polyester",
            "gender": "Nữ",
            "style": "Casual",
            "status": "ACTIVE",
            "category": {"name": "Áo chống nắng", "slug": "ao-chong-nang"},
            "tags": [{"name": "chống UV", "slug": "chong-uv"}],
            "colors": [
                {
                    "id": "color-1",
                    "colorName": "Hồng",
                    "hexCode": "#ffc0cb",
                    "images": [{"url": "https://example.com/image.webp", "isMain": True}],
                    "variants": [
                        {
                            "id": "variant-1",
                            "sizeName": "M",
                            "originalPrice": 499000,
                            "salePrice": 399000,
                            "stockQuantity": 7,
                        }
                    ],
                }
            ],
        }
    )

    assert detail.category_name == "Áo chống nắng"
    assert detail.tags == ("chống UV",)
    assert detail.colors[0].color_name == "Hồng"
    assert detail.colors[0].variants[0].size_name == "M"
    assert detail.display_price == 399000
    assert detail.total_stock == 7
    assert detail.thumbnail_url == "https://example.com/image.webp"
