import { normalizeCategory } from "./category";

describe("normalizeCategory", () => {
  it("keeps usable fallback data for the home category carousel", () => {
    const result = normalizeCategory({
      id: "cat-2",
      name: "Áo sơ mi",
      slug: "ao-so-mi",
      description: "Áo sơ mi công sở",
      sortOrder: 3,
    });

    expect(result.id).toBe("cat-2");
    expect(result.title).toBe("Áo sơ mi");
    expect(result.slug).toBe("ao-so-mi");
    expect(result.img).toContain("/images/arrivals/arrivals-02.png");
  });
});
