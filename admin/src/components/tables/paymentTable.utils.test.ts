import type { PaymentRecord } from "../../api/paymentApi";
import {
  buildPaymentSummary,
  filterPayments,
  formatCurrency,
  getMethodLabel,
  getProviderLabel,
  getTransactionTypeLabel,
  matchesPaymentSegment,
  sortPayments,
} from "./paymentTable.utils";

const buildPayment = (overrides: Partial<PaymentRecord> = {}): PaymentRecord => ({
  id: "payment-1",
  orderId: "order-1",
  orderCode: "ORD-001",
  customerName: "Nguyễn Văn An",
  transactionCode: "PAY-001",
  provider: "MOMO",
  paymentMethod: "E_WALLET",
  transactionType: "CHARGE",
  status: "PAID",
  amount: 350000,
  currency: "VND",
  providerReference: "REF-001",
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("paymentTable utils", () => {
  it("builds payment summary correctly", () => {
    const summary = buildPaymentSummary([
      buildPayment(),
      buildPayment({
        id: "payment-2",
        status: "FAILED",
        amount: 100000,
      }),
      buildPayment({
        id: "payment-3",
        status: "REFUNDED",
        amount: 50000,
      }),
    ]);

    expect(summary).toEqual({
      total: 3,
      paid: 1,
      pending: 0,
      failed: 1,
      refunded: 1,
      volume: 500000,
    });
  });

  it("filters by segment, provider and search term", () => {
    const filtered = filterPayments({
      payments: [
        buildPayment(),
        buildPayment({
          id: "payment-2",
          transactionCode: "PAY-XYZ",
          provider: "STRIPE",
          status: "FAILED",
          customerName: "Trần Minh Khoa",
        }),
      ],
      searchTerm: "xyz",
      statusFilter: "",
      providerFilter: "STRIPE",
      typeFilter: "",
      segment: "failed",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].customerName).toBe("Trần Minh Khoa");
  });

  it("sorts payments by amount descending", () => {
    const sorted = sortPayments(
      [
        buildPayment({ id: "payment-1", amount: 150000 }),
        buildPayment({ id: "payment-2", amount: 900000 }),
      ],
      "amountDesc",
    );

    expect(sorted.map((payment) => payment.id)).toEqual(["payment-2", "payment-1"]);
  });

  it("matches payment segments correctly", () => {
    expect(matchesPaymentSegment(buildPayment({ status: "PENDING" }), "pending")).toBe(true);
    expect(matchesPaymentSegment(buildPayment({ status: "PAID" }), "failed")).toBe(false);
  });

  it("formats labels and currency", () => {
    expect(formatCurrency(150000)).toContain("150.000");
    expect(getProviderLabel("VNPAY")).toBe("VNPay");
    expect(getMethodLabel("BANK_TRANSFER")).toBe("Chuyển khoản");
    expect(getTransactionTypeLabel("REFUND")).toBe("Hoàn tiền");
  });
});
