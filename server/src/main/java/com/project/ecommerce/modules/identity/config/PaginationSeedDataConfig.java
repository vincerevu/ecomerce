package com.project.ecommerce.modules.identity.config;

import com.project.ecommerce.modules.identity.entity.Address;
import com.project.ecommerce.modules.identity.entity.MembershipTier;
import com.project.ecommerce.modules.identity.entity.Role;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.enums.Gender;
import com.project.ecommerce.modules.identity.enums.RoleEnum;
import com.project.ecommerce.modules.identity.enums.UserType;
import com.project.ecommerce.modules.identity.repository.AddressRepository;
import com.project.ecommerce.modules.identity.repository.MembershipTierRepository;
import com.project.ecommerce.modules.identity.repository.PointHistoryRepository;
import com.project.ecommerce.modules.identity.repository.RoleRepository;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.entity.OrderItem;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.product.entity.Category;
import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductImage;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.entity.Tag;
import com.project.ecommerce.modules.product.repository.CategoryRepository;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import com.project.ecommerce.modules.product.repository.TagRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
@Slf4j
@ConditionalOnProperty(prefix = "app.seed.demo", name = "enabled", havingValue = "true")
public class PaginationSeedDataConfig {

    private static final int MIN_CATEGORY_COUNT = 24;
    private static final int MIN_TAG_COUNT = 30;
    private static final int MIN_MEMBERSHIP_TIER_COUNT = 8;
    private static final int MIN_CUSTOMER_COUNT = 36;
    private static final int MIN_ADDRESS_COUNT = 54;
    private static final int MIN_POINT_HISTORY_COUNT = 96;
    private static final int MIN_PRODUCT_COUNT = 48;
    private static final int MIN_ORDER_COUNT = 36;

    private static final String[] CATEGORY_LABELS = {
            "Áo", "Quần", "Giày", "Túi", "Phụ kiện", "Thể thao", "Công sở", "Đồ mặc nhà",
            "Áo khoác", "Áo thun", "Áo sơ mi", "Đầm váy", "Chân váy", "Quần jean", "Quần short",
            "Sneaker", "Sandal", "Túi đeo chéo", "Túi tote", "Thắt lưng", "Mũ nón", "Ví da",
            "Đồ tập", "Đồ thu đông"
    };

    private static final String[] TAG_LABELS = {
            "Mới về", "Bán chạy", "Giảm giá", "Hot trend", "Basic", "Premium", "Công sở", "Streetwear",
            "Unisex", "Mùa hè", "Mùa đông", "Đi học", "Đi làm", "Du lịch", "Tập luyện", "Chống nước",
            "Vải cotton", "Form rộng", "Slim fit", "Mặc nhiều", "Quà tặng", "Eco", "Phối màu",
            "Tối giản", "Năng động", "Thanh lịch", "Nhẹ", "Bền", "Phổ biến", "Lên đơn"
    };

    private static final String[] COLOR_NAMES = {
            "Đen", "Trắng", "Xám", "Kem", "Xanh navy", "Nâu", "Đỏ đô", "Hồng nhạt"
    };

    private static final String[] COLOR_HEXES = {
            "#111827", "#F9FAFB", "#9CA3AF", "#F5E7C6", "#1D4ED8", "#7C2D12", "#B91C1C", "#F9A8D4"
    };

    private static final String[] SIZE_NAMES = { "S", "M", "L", "XL", "42", "Free size" };

    private static final String[] CUSTOMER_FULL_NAMES = {
            "Nguyễn Minh Anh", "Trần Hoài Nam", "Lê Khánh Vy", "Phạm Gia Hân", "Hoàng Quốc Bảo",
            "Vũ Thanh Trúc", "Phan Đức Minh", "Đỗ Ngọc Huyền", "Bùi Quang Hưng", "Lý Bảo Ngân",
            "Đặng Thiên Phúc", "Ngô Hà My", "Dương Nhật Quang", "Trịnh Tú Uyên", "Trương Bảo Long",
            "Lương Thu Trang", "Đinh Anh Thư", "Hà Minh Khoa", "Chu Bảo Trâm", "Võ Hoàng Yến"
    };

    private static final String[] MATERIAL_LABELS = { "Cotton", "Polyester", "Canvas", "Da tổng hợp", "Denim" };

    private static final String[] PRODUCT_NAME_PREFIXES = {
            "Áo thun", "Áo sơ mi", "Quần jogger", "Quần jean", "Túi tote", "Giày sneaker",
            "Áo khoác", "Chân váy", "Đầm midi", "Áo len", "Sandal", "Ví da"
    };

    private static final String[] IMAGE_URLS = {
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
            "https://images.unsplash.com/photo-1506629905607-c0c543f11d42",
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
            "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
            "https://images.unsplash.com/photo-1483985988355-763728e1935b",
            "https://images.unsplash.com/photo-1512436991641-6745cdb1723f"
    };

    @Bean
    @org.springframework.core.annotation.Order(200)
    ApplicationRunner paginationSeedRunner(
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            ProductRepository productRepository,
            MembershipTierRepository membershipTierRepository,
            RoleRepository roleRepository,
            UserRepository userRepository,
            AddressRepository addressRepository,
            PointHistoryRepository pointHistoryRepository,
            OrderRepository orderRepository,
            PasswordEncoder passwordEncoder,
            TransactionTemplate transactionTemplate) {
        return args -> transactionTemplate.executeWithoutResult(status -> {
            seedMembershipTiers(membershipTierRepository);
            seedCategories(categoryRepository);
            seedTags(tagRepository);
            seedCustomers(userRepository, roleRepository, membershipTierRepository, passwordEncoder);
            seedAddresses(addressRepository, userRepository);
            seedPointHistory(pointHistoryRepository, userRepository);
            seedOrders(orderRepository, userRepository, productRepository);
            normalizeSeedData(membershipTierRepository, userRepository, addressRepository, pointHistoryRepository,
                    categoryRepository, tagRepository, productRepository, orderRepository);
            log.info(
                    "Pagination seed ready: categories={}, tags={}, tiers={}, customers={}, addresses={}, pointHistory={}, products={}, orders={}",
                    categoryRepository.count(),
                    tagRepository.count(),
                    membershipTierRepository.count(),
                    userRepository.countByType(UserType.CUSTOMER),
                    addressRepository.count(),
                    pointHistoryRepository.count(),
                    productRepository.count(),
                    orderRepository.count());
        });
    }

    private void seedMembershipTiers(MembershipTierRepository membershipTierRepository) {
        long currentCount = membershipTierRepository.count();
        if (currentCount >= MIN_MEMBERSHIP_TIER_COUNT) {
            return;
        }

        List<MembershipTier> tiers = new ArrayList<>();
        for (int index = (int) currentCount; index < MIN_MEMBERSHIP_TIER_COUNT; index++) {
            tiers.add(MembershipTier.builder()
                    .tierName(String.format("Tier %02d", index + 1))
                    .minSpent(BigDecimal.valueOf(index * 5_000_000L))
                    .discountPercent(Math.min(30, 3 + index))
                    .description("Hạng thành viên mẫu phục vụ kiểm thử CRM và phân trang")
                    .build());
        }
        membershipTierRepository.saveAll(tiers);
    }

    private void seedCategories(CategoryRepository categoryRepository) {
        long currentCount = categoryRepository.count();
        if (currentCount >= MIN_CATEGORY_COUNT) {
            return;
        }

        List<Category> existingRoots = new ArrayList<>(categoryRepository.findAll().stream()
                .filter(category -> category.getParent() == null)
                .toList());

        List<Category> categories = new ArrayList<>();
        for (int index = (int) currentCount; index < MIN_CATEGORY_COUNT; index++) {
            boolean rootCategory = index < 8 || existingRoots.isEmpty();
            Category parent = rootCategory ? null : existingRoots.get(index % existingRoots.size());
            Category category = Category.builder()
                    .name(CATEGORY_LABELS[index % CATEGORY_LABELS.length] + " " + String.format("%02d", index + 1))
                    .slug("seed-category-" + String.format("%02d", index + 1))
                    .description("Danh mục mẫu " + (index + 1) + " phục vụ kiểm thử phân trang")
                    .iconUrl("https://images.unsplash.com/photo-1523381210434-271e8be1f52b")
                    .sortOrder(index + 1)
                    .parent(parent)
                    .build();
            categories.add(category);
            if (rootCategory) {
                existingRoots.add(category);
            }
        }
        categoryRepository.saveAll(categories);
    }

    private void seedTags(TagRepository tagRepository) {
        long currentCount = tagRepository.count();
        if (currentCount >= MIN_TAG_COUNT) {
            return;
        }

        List<Tag> tags = new ArrayList<>();
        for (int index = (int) currentCount; index < MIN_TAG_COUNT; index++) {
            tags.add(Tag.builder()
                    .name(TAG_LABELS[index % TAG_LABELS.length] + " " + String.format("%02d", index + 1))
                    .slug("seed-tag-" + String.format("%02d", index + 1))
                    .build());
        }
        tagRepository.saveAll(tags);
    }

    private void seedCustomers(UserRepository userRepository, RoleRepository roleRepository,
            MembershipTierRepository membershipTierRepository, PasswordEncoder passwordEncoder) {
        long currentCount = userRepository.countByType(UserType.CUSTOMER);
        if (currentCount >= MIN_CUSTOMER_COUNT) {
            return;
        }

        Role userRole = roleRepository.findByNameAndIsDeletedFalse(RoleEnum.USER.name()).orElse(null);
        List<MembershipTier> tiers = membershipTierRepository.findAll();
        List<User> customers = new ArrayList<>();

        for (int index = (int) currentCount; index < MIN_CUSTOMER_COUNT; index++) {
            Set<Role> roles = new HashSet<>();
            if (userRole != null) {
                roles.add(userRole);
            }

            MembershipTier tier = tiers.isEmpty() ? null : tiers.get(index % tiers.size());
            BigDecimal totalSpent = BigDecimal.valueOf((index + 1L) * 1_250_000L);
            int totalPoints = (index + 1) * 25;

            customers.add(User.builder()
                    .phone(String.format("098700%04d", index + 1))
                    .password(passwordEncoder.encode("user123"))
                    .name(CUSTOMER_FULL_NAMES[index % CUSTOMER_FULL_NAMES.length] + " " + String.format("%02d", index + 1))
                    .email(String.format("seed-customer-%02d@ecommerce.com", index + 1))
                    .active(index % 9 != 0)
                    .type(UserType.CUSTOMER)
                    .gender(index % 2 == 0 ? Gender.MALE : Gender.FEMALE)
                    .dateOfBirth(LocalDate.of(1992 + (index % 10), (index % 12) + 1, (index % 27) + 1))
                    .membershipTier(tier)
                    .totalSpent(totalSpent)
                    .totalPoints(totalPoints)
                    .roles(roles)
                    .build());
        }

        userRepository.saveAll(customers);
    }

    private void seedAddresses(AddressRepository addressRepository, UserRepository userRepository) {
        long currentCount = addressRepository.count();
        if (currentCount >= MIN_ADDRESS_COUNT) {
            return;
        }

        List<User> customers = userRepository.findByType(UserType.CUSTOMER, PageRequest.of(0, MIN_CUSTOMER_COUNT + 20))
                .getContent();
        if (customers.isEmpty()) {
            return;
        }

        List<Address> addresses = new ArrayList<>();
        int nextIndex = (int) currentCount;
        while (currentCount + addresses.size() < MIN_ADDRESS_COUNT) {
            User user = customers.get(nextIndex % customers.size());
            addresses.add(Address.builder()
                    .user(user)
                    .receiverName(user.getName())
                    .receiverPhone(user.getPhone())
                    .province("TP. Hồ Chí Minh")
                    .district("Quận " + ((nextIndex % 12) + 1))
                    .ward("Phường " + ((nextIndex % 18) + 1))
                    .detail("Số " + (nextIndex + 10) + " Đường Mẫu " + ((nextIndex % 24) + 1))
                    .defaultAddress(nextIndex % customers.size() == 0)
                    .build());
            nextIndex++;
        }
        addressRepository.saveAll(addresses);
    }

    private void seedPointHistory(PointHistoryRepository pointHistoryRepository, UserRepository userRepository) {
        long currentCount = pointHistoryRepository.count();
        if (currentCount >= MIN_POINT_HISTORY_COUNT) {
            return;
        }

        List<User> customers = userRepository.findByType(UserType.CUSTOMER, PageRequest.of(0, MIN_CUSTOMER_COUNT + 20))
                .getContent();
        if (customers.isEmpty()) {
            return;
        }

        List<com.project.ecommerce.modules.identity.entity.PointHistory> histories = new ArrayList<>();
        int nextIndex = (int) currentCount;
        while (currentCount + histories.size() < MIN_POINT_HISTORY_COUNT) {
            User user = customers.get(nextIndex % customers.size());
            histories.add(com.project.ecommerce.modules.identity.entity.PointHistory.builder()
                    .user(user)
                    .points((nextIndex % 2 == 0 ? 1 : -1) * (10 + (nextIndex % 90)))
                    .reason(nextIndex % 3 == 0 ? "Tích điểm từ đơn hàng mẫu"
                            : nextIndex % 3 == 1 ? "Điều chỉnh thủ công từ quản trị"
                                    : "Điểm thưởng từ chiến dịch khuyến mãi")
                    .orderId(nextIndex % 3 == 0 ? String.valueOf(10_000L + nextIndex) : null)
                    .build());
            nextIndex++;
        }
        pointHistoryRepository.saveAll(histories);
    }

    private void seedProducts(ProductRepository productRepository, CategoryRepository categoryRepository,
            TagRepository tagRepository) {
        long currentCount = productRepository.count();
        if (currentCount >= MIN_PRODUCT_COUNT) {
            return;
        }

        List<Category> categories = categoryRepository.findAll();
        List<Tag> tags = tagRepository.findAll();
        if (categories.isEmpty()) {
            return;
        }

        List<Product> products = new ArrayList<>();
        for (int index = (int) currentCount; index < MIN_PRODUCT_COUNT; index++) {
            Category category = categories.get(index % categories.size());
            Product product = Product.builder()
                    .name(PRODUCT_NAME_PREFIXES[index % PRODUCT_NAME_PREFIXES.length] + " mẫu "
                            + String.format("%02d", index + 1))
                    .slug("seed-product-" + String.format("%02d", index + 1))
                    .description("Sản phẩm mẫu " + (index + 1) + " phục vụ kiểm thử phân trang và bộ lọc")
                    .shortDescription("Mẫu sản phẩm có đủ màu sắc, ảnh và biến thể để test admin")
                    .material(MATERIAL_LABELS[index % MATERIAL_LABELS.length])
                    .status(index % 7 == 0 ? "INACTIVE" : "ACTIVE")
                    .category(category)
                    .colors(new ArrayList<>())
                    .tags(new HashSet<>())
                    .build();

            int colorCount = 2 + (index % 2);
            for (int colorIndex = 0; colorIndex < colorCount; colorIndex++) {
                int paletteIndex = (index + colorIndex) % COLOR_NAMES.length;
                ProductColor color = ProductColor.builder()
                        .product(product)
                        .colorName(COLOR_NAMES[paletteIndex])
                        .hexCode(COLOR_HEXES[paletteIndex])
                        .images(new ArrayList<>())
                        .variants(new ArrayList<>())
                        .build();

                for (int imageIndex = 0; imageIndex < 2; imageIndex++) {
                    color.getImages().add(ProductImage.builder()
                            .productColor(color)
                            .imageUrl(IMAGE_URLS[(index + colorIndex + imageIndex) % IMAGE_URLS.length]
                                    + "?seed=product-" + index + "-" + colorIndex + "-" + imageIndex)
                            .imageType("image/jpeg")
                            .isMain(imageIndex == 0)
                            .sortOrder(imageIndex)
                            .build());
                }

                for (int variantIndex = 0; variantIndex < 2; variantIndex++) {
                    color.getVariants().add(ProductVariant.builder()
                            .productColor(color)
                            .sizeName(SIZE_NAMES[(index + colorIndex + variantIndex) % SIZE_NAMES.length])
                            .salePrice(BigDecimal.valueOf(149_000L + (index * 17_000L) + (variantIndex * 25_000L)))
                            .stockQuantity(6 + ((index + colorIndex + variantIndex) % 48))
                            .build());
                }

                product.getColors().add(color);
            }

            if (!tags.isEmpty()) {
                for (int tagOffset = 0; tagOffset < 3; tagOffset++) {
                    product.getTags().add(tags.get((index + tagOffset) % tags.size()));
                }
            }

            products.add(product);
        }
        productRepository.saveAll(products);
    }

    private void seedOrders(OrderRepository orderRepository, UserRepository userRepository,
            ProductRepository productRepository) {
        long currentCount = orderRepository.count();
        if (currentCount >= MIN_ORDER_COUNT) {
            return;
        }

        List<User> customers = userRepository.findByType(UserType.CUSTOMER, PageRequest.of(0, MIN_CUSTOMER_COUNT + 20))
                .getContent();
        List<Product> products = productRepository.findAll().stream()
                .filter(product -> product.getColors() != null && !product.getColors().isEmpty())
                .filter(product -> product.getColors().stream()
                        .anyMatch(color -> color.getVariants() != null && !color.getVariants().isEmpty()
                                && color.getImages() != null && !color.getImages().isEmpty()))
                .toList();
        if (customers.isEmpty() || products.isEmpty()) {
            return;
        }

        Random random = new Random(20260318L);
        List<Order> orders = new ArrayList<>();
        for (int index = (int) currentCount; index < MIN_ORDER_COUNT; index++) {
            User customer = customers.get(index % customers.size());
            OrderStatus status = OrderStatus.values()[index % OrderStatus.values().length];
            PaymentStatus paymentStatus = status == OrderStatus.CANCELLED ? PaymentStatus.REFUNDED
                    : status == OrderStatus.PENDING ? PaymentStatus.UNPAID
                            : PaymentStatus.values()[(index + 1) % PaymentStatus.values().length];

            Order order = Order.builder()
                    .orderCode(String.format("ORD-SEED-%05d", index + 1))
                    .user(customer)
                    .customerName(customer.getName())
                    .customerPhone(customer.getPhone())
                    .customerEmail(customer.getEmail())
                    .shippingAddress("Khu mẫu " + ((index % 18) + 1) + ", TP. Hồ Chí Minh")
                    .notes(index % 4 == 0 ? "Đơn ưu tiên của khách thân thiết" : "Đơn hàng mẫu phục vụ kiểm thử phân trang")
                    .status(status)
                    .paymentStatus(paymentStatus)
                    .shippingFee(BigDecimal.valueOf(20_000L + ((index % 4) * 5_000L)))
                    .discountAmount(BigDecimal.valueOf((index % 3) * 15_000L))
                    .subtotal(BigDecimal.ZERO)
                    .totalAmount(BigDecimal.ZERO)
                    .items(new ArrayList<>())
                    .build();

            int itemCount = 1 + (index % 3);
            BigDecimal subtotal = BigDecimal.ZERO;
            for (int itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                Product product = products.get((index * 2 + itemIndex) % products.size());
                List<ProductColor> validColors = product.getColors().stream()
                        .filter(color -> color.getVariants() != null && !color.getVariants().isEmpty())
                        .filter(color -> color.getImages() != null && !color.getImages().isEmpty())
                        .toList();
                ProductColor color = validColors.get((index + itemIndex) % validColors.size());
                ProductVariant variant = color.getVariants().get((index + itemIndex) % color.getVariants().size());
                ProductImage mainImage = color.getImages().stream()
                        .filter(ProductImage::isMain)
                        .findFirst()
                        .orElse(color.getImages().getFirst());
                int quantity = 1 + random.nextInt(3);
                BigDecimal lineTotal = variant.getSalePrice().multiply(BigDecimal.valueOf(quantity));

                OrderItem item = OrderItem.builder()
                        .order(order)
                        .product(product)
                        .productVariant(variant)
                        .productName(product.getName())
                        .productSlug(product.getSlug())
                        .colorName(color.getColorName())
                        .sizeName(variant.getSizeName())
                        .quantity(quantity)
                        .unitPrice(variant.getSalePrice())
                        .lineTotal(lineTotal)
                        .imageUrl(mainImage.getImageUrl())
                        .build();
                order.getItems().add(item);
                subtotal = subtotal.add(lineTotal);
            }

            order.setSubtotal(subtotal);
            order.setTotalAmount(subtotal.add(order.getShippingFee()).subtract(order.getDiscountAmount()));
            orders.add(order);
        }

        orderRepository.saveAll(orders);
    }

    private void normalizeSeedData(MembershipTierRepository membershipTierRepository, UserRepository userRepository,
            AddressRepository addressRepository, PointHistoryRepository pointHistoryRepository,
            CategoryRepository categoryRepository, TagRepository tagRepository, ProductRepository productRepository,
            OrderRepository orderRepository) {
        normalizeMembershipTiers(membershipTierRepository);
        normalizeCategories(categoryRepository);
        normalizeTags(tagRepository);
        normalizeCustomers(userRepository);
        normalizeAddresses(addressRepository);
        normalizePointHistory(pointHistoryRepository);
        normalizeOrders(orderRepository);
    }

    private void normalizeMembershipTiers(MembershipTierRepository membershipTierRepository) {
        List<MembershipTier> tiers = membershipTierRepository.findAll();
        for (int index = 0; index < tiers.size(); index++) {
            MembershipTier tier = tiers.get(index);
            if (tier.getTierName() != null && tier.getTierName().startsWith("Tier ")) {
                tier.setTierName("Hạng thành viên " + String.format("%02d", index + 1));
                tier.setDescription("Hạng thành viên mẫu phục vụ kiểm thử CRM và phân trang");
            }
        }
        membershipTierRepository.saveAll(tiers);
    }

    private void normalizeCategories(CategoryRepository categoryRepository) {
        List<Category> categories = categoryRepository.findAll();
        for (Category category : categories) {
            if (category.getSlug() != null && category.getSlug().startsWith("seed-category-")) {
                int index = parseSeedNumber(category.getSlug());
                if (index > 0) {
                    category.setName(CATEGORY_LABELS[(index - 1) % CATEGORY_LABELS.length] + " "
                            + String.format("%02d", index));
                    category.setDescription("Danh mục mẫu " + index + " phục vụ kiểm thử phân trang");
                }
            }
        }
        categoryRepository.saveAll(categories);
    }

    private void normalizeTags(TagRepository tagRepository) {
        List<Tag> tags = tagRepository.findAll();
        for (Tag tag : tags) {
            if (tag.getSlug() != null && tag.getSlug().startsWith("seed-tag-")) {
                int index = parseSeedNumber(tag.getSlug());
                if (index > 0) {
                    tag.setName(TAG_LABELS[(index - 1) % TAG_LABELS.length] + " " + String.format("%02d", index));
                }
            }
        }
        tagRepository.saveAll(tags);
    }

    private void normalizeCustomers(UserRepository userRepository) {
        List<User> customers = userRepository.findByType(UserType.CUSTOMER, PageRequest.of(0, 256)).getContent();
        for (User customer : customers) {
            if (customer.getEmail() != null && customer.getEmail().startsWith("seed-customer-")) {
                int index = parseSeedNumber(customer.getEmail());
                if (index > 0) {
                    customer.setName(CUSTOMER_FULL_NAMES[(index - 1) % CUSTOMER_FULL_NAMES.length] + " "
                            + String.format("%02d", index));
                }
            }
        }
        userRepository.saveAll(customers);
    }

    private void normalizeAddresses(AddressRepository addressRepository) {
        List<Address> addresses = addressRepository.findAll();
        for (Address address : addresses) {
            if (address.getDetail() != null && (address.getDetail().contains("Seed") || address.getDetail().contains("Mẫu"))) {
                int index = extractTrailingNumber(address.getDetail());
                address.setProvince("TP. Hồ Chí Minh");
                address.setDistrict("Quận " + ((Math.max(index, 1) % 12) + 1));
                address.setWard("Phường " + ((Math.max(index, 1) % 18) + 1));
                address.setDetail("Số " + (Math.max(index, 1) + 10) + " Đường Mẫu " + ((Math.max(index, 1) % 24) + 1));
            }
        }
        addressRepository.saveAll(addresses);
    }

    private void normalizePointHistory(PointHistoryRepository pointHistoryRepository) {
        List<com.project.ecommerce.modules.identity.entity.PointHistory> histories = pointHistoryRepository.findAll();
        for (int index = 0; index < histories.size(); index++) {
            var history = histories.get(index);
            if (history.getReason() != null && (history.getReason().contains("seed") || history.getReason().contains("Order reward"))) {
                history.setReason(index % 3 == 0 ? "Tích điểm từ đơn hàng mẫu"
                        : index % 3 == 1 ? "Điều chỉnh thủ công từ quản trị"
                                : "Điểm thưởng từ chiến dịch khuyến mãi");
            }
        }
        pointHistoryRepository.saveAll(histories);
    }

    private void normalizeProducts(ProductRepository productRepository, CategoryRepository categoryRepository,
            TagRepository tagRepository) {
        List<Category> categories = categoryRepository.findAll();
        List<Tag> tags = tagRepository.findAll();
        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            String slug = product.getSlug();
            if (slug == null) {
                continue;
            }

            if (slug.startsWith("seed-product-")) {
                int index = parseSeedNumber(slug);
                if (index > 0) {
                    product.setName(PRODUCT_NAME_PREFIXES[(index - 1) % PRODUCT_NAME_PREFIXES.length] + " mẫu "
                            + String.format("%02d", index));
                    product.setDescription("Sản phẩm mẫu " + index + " phục vụ kiểm thử phân trang và bộ lọc");
                    product.setShortDescription("Mẫu sản phẩm có đủ màu sắc, ảnh và biến thể để test admin");
                    product.setMaterial(MATERIAL_LABELS[(index - 1) % MATERIAL_LABELS.length]);
                    if (!categories.isEmpty() && product.getCategory() == null) {
                        product.setCategory(categories.get((index - 1) % categories.size()));
                    }
                    if (!tags.isEmpty() && product.getTags() != null && product.getTags().isEmpty()) {
                        for (int tagOffset = 0; tagOffset < 3; tagOffset++) {
                            product.getTags().add(tags.get(((index - 1) + tagOffset) % tags.size()));
                        }
                    }
                }
            } else if ("ao-khoac-bomber".equals(slug)) {
                product.setName("Áo khoác bomber");
            } else if ("quan-jogger-ni".equals(slug)) {
                product.setName("Quần jogger nỉ");
            } else if ("ao-thun-basic".equals(slug)) {
                product.setName("Áo thun basic");
            } else if ("sneaker-urban".equals(slug)) {
                product.setName("Sneaker urban");
            } else if ("tui-tote-canvas".equals(slug)) {
                product.setName("Túi tote canvas");
            }

            if (product.getColors() != null) {
                for (int colorIndex = 0; colorIndex < product.getColors().size(); colorIndex++) {
                    ProductColor color = product.getColors().get(colorIndex);
                    if (color.getColorName() != null) {
                        color.setColorName(normalizeColorName(color.getColorName(), colorIndex));
                    }
                }
            }
        }
        productRepository.saveAll(products);
    }

    private void normalizeOrders(OrderRepository orderRepository) {
        List<Order> orders = orderRepository.findAll();
        for (Order order : orders) {
            if (order.getOrderCode() != null && order.getOrderCode().startsWith("ORD-SEED-")) {
                int index = parseSeedNumber(order.getOrderCode());
                order.setShippingAddress("Khu mẫu " + ((Math.max(index, 1) % 18) + 1) + ", TP. Hồ Chí Minh");
                order.setNotes(index % 4 == 0 ? "Đơn ưu tiên của khách thân thiết"
                        : "Đơn hàng mẫu phục vụ kiểm thử phân trang");
            }
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getProduct() != null) {
                        item.setProductName(item.getProduct().getName());
                        item.setProductSlug(item.getProduct().getSlug());
                    }
                    if (item.getProductVariant() != null) {
                        item.setSizeName(item.getProductVariant().getSizeName());
                        if (item.getProductVariant().getProductColor() != null) {
                            ProductColor color = item.getProductVariant().getProductColor();
                            item.setColorName(normalizeColorName(color.getColorName(), 0));
                            item.setImageUrl(color.getImages() != null && !color.getImages().isEmpty()
                                    ? color.getImages().get(0).getImageUrl()
                                    : item.getImageUrl());
                        }
                    } else if (item.getColorName() != null) {
                        item.setColorName(normalizeColorName(item.getColorName(), 0));
                    }
                }
            }
        }
        orderRepository.saveAll(orders);
    }

    private String normalizeColorName(String rawColorName, int fallbackIndex) {
        return switch (rawColorName) {
            case "Den" -> "Đen";
            case "Trang" -> "Trắng";
            case "Xam" -> "Xám";
            case "Kem" -> "Kem";
            case "Nau" -> "Nâu";
            case "Do do" -> "Đỏ đô";
            case "Hong nhat" -> "Hồng nhạt";
            default -> COLOR_NAMES[fallbackIndex % COLOR_NAMES.length];
        };
    }

    private int parseSeedNumber(String value) {
        String digits = value.replaceAll("\\D+", "");
        if (digits.isBlank()) {
            return -1;
        }
        return Integer.parseInt(digits);
    }

    private int extractTrailingNumber(String value) {
        String digits = value.replaceAll(".*?(\\d+)$", "$1");
        if (digits.equals(value) || digits.isBlank()) {
            return 1;
        }
        return Integer.parseInt(digits);
    }
}
