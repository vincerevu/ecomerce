import type { CustomerRecord } from "../../api/customerApi";
import {
  buildCustomerSummary,
  filterCustomers,
  formatCurrency,
  getCustomerInitials,
  matchesSegment,
  sortCustomers,
} from "./customerTable.utils";

const buildCustomer = (
  overrides: Partial<CustomerRecord> = {},
): CustomerRecord => ({
  id: "customer-1",
  phone: "0900000001",
  name: "Nguyen Van A",
  email: "a@example.com",
  type: "CUSTOMER",
  active: true,
  createdAt: new Date().toISOString(),
  totalSpent: 1_200_000,
  totalPoints: 350,
  membershipTier: {
    id: "tier-1",
    tierName: "Gold",
  },
  roles: [],
  ...overrides,
});

describe("customerTable utils", () => {
  it("builds customer summary correctly", () => {
    const customers = [
      buildCustomer(),
      buildCustomer({
        id: "customer-2",
        active: false,
        totalSpent: 500_000,
        totalPoints: 50,
        membershipTier: null,
      }),
    ];

    expect(buildCustomerSummary(customers)).toEqual({
      total: 2,
      active: 1,
      blocked: 1,
      loyal: 1,
      totalRevenue: 1_700_000,
    });
  });

  it("filters by segment and search term", () => {
    const customers = [
      buildCustomer({ name: "Tran Thi B" }),
      buildCustomer({
        id: "customer-2",
        name: "Pham Van C",
        phone: "0911222333",
        active: false,
      }),
    ];

    const filtered = filterCustomers({
      customers,
      searchTerm: "0911",
      tierFilter: "",
      statusFilter: "",
      segment: "blocked",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Pham Van C");
  });

  it("sorts customers by spent descending", () => {
    const sorted = sortCustomers(
      [
        buildCustomer({ id: "customer-1", totalSpent: 100_000 }),
        buildCustomer({ id: "customer-2", totalSpent: 900_000 }),
      ],
      "spent",
    );

    expect(sorted.map((customer) => customer.id)).toEqual([
      "customer-2",
      "customer-1",
    ]);
  });

  it("detects loyal segment correctly", () => {
    expect(matchesSegment(buildCustomer(), "loyal")).toBe(true);
    expect(
      matchesSegment(
        buildCustomer({
          totalSpent: 0,
          totalPoints: 10,
          membershipTier: null,
        }),
        "loyal",
      ),
    ).toBe(false);
  });

  it("formats currency and initials", () => {
    expect(formatCurrency(150000)).toContain("150.000");
    expect(getCustomerInitials("Nguyen Van A")).toBe("NV");
  });
});
