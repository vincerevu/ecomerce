import type { OrderRecord } from "../../api/orderApi";
import {
  buildOrderSummary,
  filterOrders,
  formatCurrency,
  getOrderStatusMeta,
  sortOrders,
} from "./orderTable.utils";

const buildOrder = (overrides: Partial<OrderRecord> = {}): OrderRecord => ({
  id: "order-1",
  orderCode: "ORD-1001",
  customerName: "Nguyen Van A",
  customerPhone: "0900000001",
  customerEmail: "a@example.com",
  shippingAddress: "Ha Noi",
  status: "PENDING",
  paymentStatus: "UNPAID",
  subtotal: 300000,
  shippingFee: 30000,
  discountAmount: 0,
  totalAmount: 330000,
  itemCount: 2,
  createdAt: "2026-03-10T10:00:00Z",
  items: [],
  ...overrides,
});

describe("orderTable utils", () => {
  it("builds summary counts and delivered revenue", () => {
    const summary = buildOrderSummary([
      buildOrder({ status: "PENDING" }),
      buildOrder({ id: "2", status: "SHIPPING" }),
      buildOrder({ id: "3", status: "DELIVERED", totalAmount: 500000 }),
    ]);

    expect(summary).toEqual({
      total: 3,
      attention: 1,
      shipping: 1,
      done: 1,
      revenue: 500000,
    });
  });

  it("filters by search, payment and segment", () => {
    const orders = [
      buildOrder({
        orderCode: "ORD-1001",
        customerName: "Lan",
        paymentStatus: "PAID",
        status: "DELIVERED",
      }),
      buildOrder({
        id: "2",
        orderCode: "ORD-1002",
        customerName: "Huy",
        paymentStatus: "UNPAID",
        status: "PENDING",
      }),
    ];

    const result = filterOrders({
      orders,
      searchTerm: "1002",
      statusFilter: "",
      paymentFilter: "UNPAID",
      segment: "attention",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.orderCode).toBe("ORD-1002");
  });

  it("sorts orders by value descending", () => {
    const sorted = sortOrders(
      [
        buildOrder({ id: "1", totalAmount: 200000 }),
        buildOrder({ id: "2", totalAmount: 800000 }),
      ],
      "valueDesc",
    );

    expect(sorted.map((item) => item.id)).toEqual(["2", "1"]);
  });

  it("returns localized currency", () => {
    expect(formatCurrency(150000)).toBe("150.000 ₫");
  });

  it("maps order status meta", () => {
    expect(getOrderStatusMeta("SHIPPING")).toEqual({
      label: "Đang giao",
      color: "primary",
    });
  });
});
