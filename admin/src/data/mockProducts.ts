// Mock data for Product Management UI
// Structure mirrors the backend entity: Product -> ProductColor -> ProductVariant

export type ProductStatus = "ACTIVE" | "INACTIVE";

export interface ProductVariantMock {
    id: string;
    sizeName: string;
    salePrice: number;
    stockQuantity: number;
}

export interface ProductColorMock {
    id: string;
    colorName: string;
    hexCode: string;
    imageUrl: string; // ảnh đại diện cho màu này
    variants: ProductVariantMock[];
}

export interface ProductMock {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    material: string;
    category: { id: string; name: string };
    colors: ProductColorMock[];
    tags: string[];
    status: ProductStatus;
    createdAt: string;
}

export const MOCK_CATEGORIES = [
    { id: "cat-1", name: "Áo" },
    { id: "cat-2", name: "Quần" },
    { id: "cat-3", name: "Váy" },
    { id: "cat-4", name: "Phụ kiện" },
    { id: "cat-5", name: "Giày dép" },
];

export const MOCK_TAGS = ["New", "Hot", "Sale", "Trending", "Limited", "Bestseller", "Premium"];

export const MOCK_PRODUCTS: ProductMock[] = [
    {
        id: "p-001",
        name: "Áo Thun Basic Unisex",
        slug: "ao-thun-basic-unisex",
        shortDescription: "Áo thun cổ tròn basic, chất liệu cotton 100%, thoáng mát",
        description: "Áo thun cổ tròn thiết kế basic phù hợp mọi phong cách. Chất liệu cotton 100% co giãn 4 chiều, thấm hút mồ hôi tốt.",
        material: "Cotton 100%",
        category: { id: "cat-1", name: "Áo" },
        tags: ["New", "Trending"],
        status: "ACTIVE",
        createdAt: "2026-01-10T08:00:00Z",
        colors: [
            {
                id: "c-001-1",
                colorName: "Trắng",
                hexCode: "#FFFFFF",
                imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300",
                variants: [
                    { id: "v-1", sizeName: "S", salePrice: 199000, stockQuantity: 50 },
                    { id: "v-2", sizeName: "M", salePrice: 199000, stockQuantity: 80 },
                    { id: "v-3", sizeName: "L", salePrice: 219000, stockQuantity: 60 },
                    { id: "v-4", sizeName: "XL", salePrice: 219000, stockQuantity: 30 },
                ],
            },
            {
                id: "c-001-2",
                colorName: "Đen",
                hexCode: "#1A1A1A",
                imageUrl: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=300",
                variants: [
                    { id: "v-5", sizeName: "S", salePrice: 199000, stockQuantity: 45 },
                    { id: "v-6", sizeName: "M", salePrice: 199000, stockQuantity: 90 },
                    { id: "v-7", sizeName: "L", salePrice: 219000, stockQuantity: 55 },
                    { id: "v-8", sizeName: "XL", salePrice: 219000, stockQuantity: 10 },
                ],
            },
            {
                id: "c-001-3",
                colorName: "Xám",
                hexCode: "#9CA3AF",
                imageUrl: "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=300",
                variants: [
                    { id: "v-9", sizeName: "S", salePrice: 199000, stockQuantity: 30 },
                    { id: "v-10", sizeName: "M", salePrice: 199000, stockQuantity: 70 },
                    { id: "v-11", sizeName: "L", salePrice: 219000, stockQuantity: 40 },
                ],
            },
        ],
    },
    {
        id: "p-002",
        name: "Quần Jean Slim Fit Nam",
        slug: "quan-jean-slim-fit-nam",
        shortDescription: "Quần jean ôm vừa, co giãn nhẹ, nhiều màu sắc trẻ trung",
        description: "Quần jean slim fit ôm vừa vặn, thiết kế năng động. Chất liệu denim cao cấp có sợi co giãn giúp thoải mái vận động.",
        material: "Denim 98% Cotton, 2% Spandex",
        category: { id: "cat-2", name: "Quần" },
        tags: ["Hot", "Bestseller"],
        status: "ACTIVE",
        createdAt: "2026-01-15T09:00:00Z",
        colors: [
            {
                id: "c-002-1",
                colorName: "Xanh đậm",
                hexCode: "#1E3A5F",
                imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300",
                variants: [
                    { id: "v-12", sizeName: "28", salePrice: 459000, stockQuantity: 25 },
                    { id: "v-13", sizeName: "30", salePrice: 459000, stockQuantity: 40 },
                    { id: "v-14", sizeName: "32", salePrice: 459000, stockQuantity: 35 },
                    { id: "v-15", sizeName: "34", salePrice: 479000, stockQuantity: 20 },
                ],
            },
            {
                id: "c-002-2",
                colorName: "Xám nhạt",
                hexCode: "#D1D5DB",
                imageUrl: "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=300",
                variants: [
                    { id: "v-16", sizeName: "28", salePrice: 459000, stockQuantity: 18 },
                    { id: "v-17", sizeName: "30", salePrice: 459000, stockQuantity: 30 },
                    { id: "v-18", sizeName: "32", salePrice: 459000, stockQuantity: 3 },
                ],
            },
        ],
    },
    {
        id: "p-003",
        name: "Váy Liền Hoa Nhí Nữ",
        slug: "vay-lien-hoa-nhi-nu",
        shortDescription: "Váy liền hoa nhí dịu dàng, chất vải nhẹ, phù hợp đi chơi",
        description: "Váy liền thân hoạ tiết hoa nhí nhỏ nhắn, thiết kế thanh lịch phù hợp nhiều dịp.",
        material: "Viscose",
        category: { id: "cat-3", name: "Váy" },
        tags: ["New", "Trending"],
        status: "ACTIVE",
        createdAt: "2026-01-20T10:00:00Z",
        colors: [
            {
                id: "c-003-1",
                colorName: "Hoa nền hồng",
                hexCode: "#F9A8D4",
                imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300",
                variants: [
                    { id: "v-19", sizeName: "S", salePrice: 389000, stockQuantity: 22 },
                    { id: "v-20", sizeName: "M", salePrice: 389000, stockQuantity: 38 },
                    { id: "v-21", sizeName: "L", salePrice: 399000, stockQuantity: 15 },
                ],
            },
            {
                id: "c-003-2",
                colorName: "Hoa nền xanh",
                hexCode: "#BAE6FD",
                imageUrl: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=300",
                variants: [
                    { id: "v-22", sizeName: "S", salePrice: 389000, stockQuantity: 10 },
                    { id: "v-23", sizeName: "M", salePrice: 389000, stockQuantity: 27 },
                ],
            },
        ],
    },
    {
        id: "p-004",
        name: "Giày Sneaker Canvas",
        slug: "giay-sneaker-canvas",
        shortDescription: "Giày sneaker vải canvas cổ thấp, đế cao su, nhiều màu",
        description: "Giày sneaker làm từ vải canvas cao cấp, đế cao su chống trượt, thiết kế nhẹ nhàng phù hợp đi học, đi làm.",
        material: "Canvas + Rubber sole",
        category: { id: "cat-5", name: "Giày dép" },
        tags: ["Hot", "Sale"],
        status: "ACTIVE",
        createdAt: "2026-02-01T08:00:00Z",
        colors: [
            {
                id: "c-004-1",
                colorName: "Trắng",
                hexCode: "#F9FAFB",
                imageUrl: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300",
                variants: [
                    { id: "v-24", sizeName: "38", salePrice: 549000, stockQuantity: 12 },
                    { id: "v-25", sizeName: "39", salePrice: 549000, stockQuantity: 20 },
                    { id: "v-26", sizeName: "40", salePrice: 549000, stockQuantity: 18 },
                    { id: "v-27", sizeName: "41", salePrice: 549000, stockQuantity: 8 },
                    { id: "v-28", sizeName: "42", salePrice: 569000, stockQuantity: 5 },
                ],
            },
            {
                id: "c-004-2",
                colorName: "Đen",
                hexCode: "#111827",
                imageUrl: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300",
                variants: [
                    { id: "v-29", sizeName: "38", salePrice: 549000, stockQuantity: 0 },
                    { id: "v-30", sizeName: "39", salePrice: 549000, stockQuantity: 15 },
                    { id: "v-31", sizeName: "40", salePrice: 549000, stockQuantity: 22 },
                ],
            },
        ],
    },
    {
        id: "p-005",
        name: "Túi Tote Canvas In Chữ",
        slug: "tui-tote-canvas-in-chu",
        shortDescription: "Túi tote canvas in chữ phong cách, sức chứa lớn",
        description: "Túi tote làm bằng canvas 400gsm chắc chắn, quai vải dày, nhiều ngăn tiện lợi.",
        material: "Canvas 400gsm",
        category: { id: "cat-4", name: "Phụ kiện" },
        tags: ["New", "Limited"],
        status: "ACTIVE",
        createdAt: "2026-02-10T09:00:00Z",
        colors: [
            {
                id: "c-005-1",
                colorName: "Be sữa",
                hexCode: "#F5F0E8",
                imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300",
                variants: [
                    { id: "v-32", sizeName: "Free size", salePrice: 159000, stockQuantity: 100 },
                ],
            },
            {
                id: "c-005-2",
                colorName: "Đen",
                hexCode: "#1F2937",
                imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300",
                variants: [
                    { id: "v-33", sizeName: "Free size", salePrice: 159000, stockQuantity: 75 },
                ],
            },
        ],
    },
    {
        id: "p-006",
        name: "Áo Hoodie Oversize",
        slug: "ao-hoodie-oversize",
        shortDescription: "Hoodie oversize dày dặn, phù hợp thời tiết se lạnh",
        description: "Áo hoodie oversize chất nỉ dày 380gsm, form rộng thoải mái, túi kangaroo tiện lợi.",
        material: "Nỉ 380gsm",
        category: { id: "cat-1", name: "Áo" },
        tags: ["Bestseller", "Trending"],
        status: "ACTIVE",
        createdAt: "2026-02-15T10:00:00Z",
        colors: [
            {
                id: "c-006-1",
                colorName: "Xám đậm",
                hexCode: "#4B5563",
                imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=300",
                variants: [
                    { id: "v-34", sizeName: "S", salePrice: 499000, stockQuantity: 30 },
                    { id: "v-35", sizeName: "M", salePrice: 499000, stockQuantity: 50 },
                    { id: "v-36", sizeName: "L", salePrice: 519000, stockQuantity: 40 },
                    { id: "v-37", sizeName: "XL", salePrice: 519000, stockQuantity: 25 },
                ],
            },
            {
                id: "c-006-2",
                colorName: "Kem",
                hexCode: "#FEF3C7",
                imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300",
                variants: [
                    { id: "v-38", sizeName: "S", salePrice: 499000, stockQuantity: 20 },
                    { id: "v-39", sizeName: "M", salePrice: 499000, stockQuantity: 35 },
                    { id: "v-40", sizeName: "L", salePrice: 519000, stockQuantity: 2 },
                ],
            },
        ],
    },
    {
        id: "p-007",
        name: "Quần Shorts Kaki Nam",
        slug: "quan-shorts-kaki-nam",
        shortDescription: "Shorts kaki 4 túi, phù hợp đi biển và dạo phố",
        description: "Quần shorts kaki 4 túi chắc chắn, chất vải thoáng mát phù hợp mùa hè.",
        material: "Kaki cotton 65%",
        category: { id: "cat-2", name: "Quần" },
        tags: ["Sale"],
        status: "INACTIVE",
        createdAt: "2026-02-18T11:00:00Z",
        colors: [
            {
                id: "c-007-1",
                colorName: "Be",
                hexCode: "#D4B896",
                imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=300",
                variants: [
                    { id: "v-41", sizeName: "28", salePrice: 289000, stockQuantity: 5 },
                    { id: "v-42", sizeName: "30", salePrice: 289000, stockQuantity: 12 },
                    { id: "v-43", sizeName: "32", salePrice: 289000, stockQuantity: 8 },
                ],
            },
        ],
    },
    {
        id: "p-008",
        name: "Áo Sơ Mi Kẻ Sọc Nữ",
        slug: "ao-so-mi-ke-soc-nu",
        shortDescription: "Áo sơ mi kẻ sọc nhỏ thanh lịch, phù hợp đi làm",
        description: "Áo sơ mi nữ hoạ tiết kẻ sọc nhỏ tinh tế, form regular phù hợp đi làm và dạo phố.",
        material: "Polyester blend",
        category: { id: "cat-1", name: "Áo" },
        tags: ["New", "Premium"],
        status: "ACTIVE",
        createdAt: "2026-02-20T08:00:00Z",
        colors: [
            {
                id: "c-008-1",
                colorName: "Xanh trắng",
                hexCode: "#BFDBFE",
                imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=300",
                variants: [
                    { id: "v-44", sizeName: "S", salePrice: 349000, stockQuantity: 40 },
                    { id: "v-45", sizeName: "M", salePrice: 349000, stockQuantity: 55 },
                    { id: "v-46", sizeName: "L", salePrice: 359000, stockQuantity: 30 },
                ],
            },
            {
                id: "c-008-2",
                colorName: "Đen trắng",
                hexCode: "#6B7280",
                imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300",
                variants: [
                    { id: "v-47", sizeName: "S", salePrice: 349000, stockQuantity: 22 },
                    { id: "v-48", sizeName: "M", salePrice: 349000, stockQuantity: 33 },
                ],
            },
        ],
    },
    {
        id: "p-009",
        name: "Dép Quai Hậu Da Bò",
        slug: "dep-quai-hau-da-bo",
        shortDescription: "Dép quai hậu da bò thật, đế EVA siêu nhẹ",
        description: "Dép da bò thật handcrafted, đế EVA nhẹ và êm, quai điều chỉnh được độ rộng.",
        material: "Da bò thật + Đế EVA",
        category: { id: "cat-5", name: "Giày dép" },
        tags: ["Premium", "Limited"],
        status: "ACTIVE",
        createdAt: "2026-03-01T09:00:00Z",
        colors: [
            {
                id: "c-009-1",
                colorName: "Nâu cognac",
                hexCode: "#92400E",
                imageUrl: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=300",
                variants: [
                    { id: "v-49", sizeName: "38", salePrice: 899000, stockQuantity: 8 },
                    { id: "v-50", sizeName: "39", salePrice: 899000, stockQuantity: 10 },
                    { id: "v-51", sizeName: "40", salePrice: 899000, stockQuantity: 7 },
                    { id: "v-52", sizeName: "41", salePrice: 919000, stockQuantity: 5 },
                ],
            },
        ],
    },
    {
        id: "p-010",
        name: "Mũ Bucket Hat Linen",
        slug: "mu-bucket-hat-linen",
        shortDescription: "Mũ bucket chất linen tự nhiên, nhẹ và thấm mồ hôi",
        description: "Mũ bucket hat làm từ vải linen tự nhiên 100%, form thoải mái phù hợp nhiều khuôn mặt.",
        material: "Linen 100%",
        category: { id: "cat-4", name: "Phụ kiện" },
        tags: ["Trending", "New"],
        status: "ACTIVE",
        createdAt: "2026-03-03T10:00:00Z",
        colors: [
            {
                id: "c-010-1",
                colorName: "Trắng kem",
                hexCode: "#FFFBEB",
                imageUrl: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=300",
                variants: [
                    { id: "v-53", sizeName: "Free size", salePrice: 189000, stockQuantity: 60 },
                ],
            },
            {
                id: "c-010-2",
                colorName: "Xanh đất",
                hexCode: "#4B6043",
                imageUrl: "https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=300",
                variants: [
                    { id: "v-54", sizeName: "Free size", salePrice: 189000, stockQuantity: 45 },
                ],
            },
            {
                id: "c-010-3",
                colorName: "Hồng đất",
                hexCode: "#D88B73",
                imageUrl: "https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?w=300",
                variants: [
                    { id: "v-55", sizeName: "Free size", salePrice: 189000, stockQuantity: 4 },
                ],
            },
        ],
    },
    {
        id: "p-011",
        name: "Áo Khoác Bomber",
        slug: "ao-khoac-bomber",
        shortDescription: "Áo khoác bomber unisex, phom rộng, khoá 2 chiều",
        description: "Áo khoác bomber phong cách street style, chất gió nylon chống nước nhẹ, khoá YKK bền.",
        material: "Nylon + lót microfiber",
        category: { id: "cat-1", name: "Áo" },
        tags: ["Hot", "Bestseller"],
        status: "ACTIVE",
        createdAt: "2026-03-05T08:00:00Z",
        colors: [
            {
                id: "c-011-1",
                colorName: "Đen",
                hexCode: "#111827",
                imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300",
                variants: [
                    { id: "v-56", sizeName: "M", salePrice: 699000, stockQuantity: 20 },
                    { id: "v-57", sizeName: "L", salePrice: 699000, stockQuantity: 30 },
                    { id: "v-58", sizeName: "XL", salePrice: 719000, stockQuantity: 15 },
                ],
            },
            {
                id: "c-011-2",
                colorName: "Olive",
                hexCode: "#6B7C3A",
                imageUrl: "https://images.unsplash.com/photo-1578681994506-b8f463449011?w=300",
                variants: [
                    { id: "v-59", sizeName: "M", salePrice: 699000, stockQuantity: 12 },
                    { id: "v-60", sizeName: "L", salePrice: 699000, stockQuantity: 18 },
                    { id: "v-61", sizeName: "XL", salePrice: 719000, stockQuantity: 3 },
                ],
            },
        ],
    },
    {
        id: "p-012",
        name: "Quần Jogger Thể Thao",
        slug: "quan-jogger-the-thao",
        shortDescription: "Quần jogger co giãn 4 chiều, phù hợp tập gym và dạo phố",
        description: "Quần jogger chất thun lạnh 4 chiều, có túi zip tiện lợi, gấu bo gọn.",
        material: "Thun lạnh 4 chiều",
        category: { id: "cat-2", name: "Quần" },
        tags: ["Hot"],
        status: "ACTIVE",
        createdAt: "2026-03-06T09:00:00Z",
        colors: [
            {
                id: "c-012-1",
                colorName: "Đen",
                hexCode: "#1F2937",
                imageUrl: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=300",
                variants: [
                    { id: "v-62", sizeName: "S", salePrice: 329000, stockQuantity: 40 },
                    { id: "v-63", sizeName: "M", salePrice: 329000, stockQuantity: 60 },
                    { id: "v-64", sizeName: "L", salePrice: 349000, stockQuantity: 35 },
                    { id: "v-65", sizeName: "XL", salePrice: 349000, stockQuantity: 20 },
                ],
            },
            {
                id: "c-012-2",
                colorName: "Xám",
                hexCode: "#9CA3AF",
                imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300",
                variants: [
                    { id: "v-66", sizeName: "S", salePrice: 329000, stockQuantity: 25 },
                    { id: "v-67", sizeName: "M", salePrice: 329000, stockQuantity: 45 },
                ],
            },
        ],
    },
    {
        id: "p-013",
        name: "Đầm Maxi Dự Tiệc",
        slug: "dam-maxi-du-tiec",
        shortDescription: "Đầm maxi lụa satin cao cấp, phù hợp dự tiệc",
        description: "Đầm maxi chất liệu lụa satin mềm mại, thiết kế cổ V thanh lịch, tà xẻ nhẹ.",
        material: "Satin lụa 100%",
        category: { id: "cat-3", name: "Váy" },
        tags: ["Premium", "Limited"],
        status: "ACTIVE",
        createdAt: "2026-03-07T10:00:00Z",
        colors: [
            {
                id: "c-013-1",
                colorName: "Đỏ rượu",
                hexCode: "#7F1D1D",
                imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=300",
                variants: [
                    { id: "v-68", sizeName: "S", salePrice: 1290000, stockQuantity: 5 },
                    { id: "v-69", sizeName: "M", salePrice: 1290000, stockQuantity: 7 },
                    { id: "v-70", sizeName: "L", salePrice: 1390000, stockQuantity: 4 },
                ],
            },
            {
                id: "c-013-2",
                colorName: "Xanh cobalt",
                hexCode: "#1E3A8A",
                imageUrl: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=300",
                variants: [
                    { id: "v-71", sizeName: "S", salePrice: 1290000, stockQuantity: 3 },
                    { id: "v-72", sizeName: "M", salePrice: 1290000, stockQuantity: 6 },
                ],
            },
        ],
    },
    {
        id: "p-014",
        name: "Áo Polo Cotton Pique",
        slug: "ao-polo-cotton-pique",
        shortDescription: "Áo polo cotton pique cổ trụ, phong cách lịch sự",
        description: "Áo polo cotton pique 220gsm, cổ trụ bo kỹ, tay ngắn phù hợp đi làm và dạo phố.",
        material: "Cotton Pique 220gsm",
        category: { id: "cat-1", name: "Áo" },
        tags: ["New", "Premium"],
        status: "INACTIVE",
        createdAt: "2026-03-08T08:00:00Z",
        colors: [
            {
                id: "c-014-1",
                colorName: "Trắng",
                hexCode: "#F9FAFB",
                imageUrl: "https://images.unsplash.com/photo-1625910513360-3e013a568778?w=300",
                variants: [
                    { id: "v-73", sizeName: "S", salePrice: 399000, stockQuantity: 0 },
                    { id: "v-74", sizeName: "M", salePrice: 399000, stockQuantity: 0 },
                    { id: "v-75", sizeName: "L", salePrice: 419000, stockQuantity: 0 },
                ],
            },
        ],
    },
    {
        id: "p-015",
        name: "Bộ Pyjama Lụa Nữ",
        slug: "bo-pyjama-lua-nu",
        shortDescription: "Bộ đồ ngủ lụa mềm mại, thoáng mát dễ chịu",
        description: "Bộ pyjama chất liệu lụa nhân tạo mềm, mát, thấm mồ hôi, thiết kế thanh lịch.",
        material: "Lụa nhân tạo",
        category: { id: "cat-3", name: "Váy" },
        tags: ["Bestseller", "Sale"],
        status: "ACTIVE",
        createdAt: "2026-03-09T09:00:00Z",
        colors: [
            {
                id: "c-015-1",
                colorName: "Hồng pastel",
                hexCode: "#FBCFE8",
                imageUrl: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=300",
                variants: [
                    { id: "v-76", sizeName: "S", salePrice: 459000, stockQuantity: 30 },
                    { id: "v-77", sizeName: "M", salePrice: 459000, stockQuantity: 45 },
                    { id: "v-78", sizeName: "L", salePrice: 479000, stockQuantity: 20 },
                ],
            },
            {
                id: "c-015-2",
                colorName: "Xanh lá nhạt",
                hexCode: "#D1FAE5",
                imageUrl: "https://images.unsplash.com/photo-1617952236317-0bd127407984?w=300",
                variants: [
                    { id: "v-79", sizeName: "S", salePrice: 459000, stockQuantity: 18 },
                    { id: "v-80", sizeName: "M", salePrice: 459000, stockQuantity: 28 },
                ],
            },
        ],
    },
];

// Helper functions
export function getTotalStock(product: ProductMock): number {
    return product.colors.flatMap(c => c.variants).reduce((sum, v) => sum + v.stockQuantity, 0);
}

export function getPriceRange(product: ProductMock): { min: number; max: number } {
    const prices = product.colors.flatMap(c => c.variants).map(v => v.salePrice);
    return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function formatPrice(amount: number): string {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}
