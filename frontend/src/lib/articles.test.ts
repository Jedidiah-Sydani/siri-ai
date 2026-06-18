import { describe, expect, it } from "vitest";
import {
  deselectAllArticles,
  deselectArticlesById,
  filterArticles,
  markDuplicates,
  selectArticlesById,
  pullArticleDetails,
  selectAllArticles,
  selectUniqueArticles,
  setArticleSelected,
} from "./articles";
import type { Article } from "../types";

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: `a-${Math.random()}`,
    source: "PubMed",
    doi: "10.1/x",
    title: "A",
    author: "Author A",
    sourceUrl: "https://doi.org/10.1/x",
    year: "2024",
    abstract: "",
    fullTextStatus: "Not pulled",
    selected: false,
    reviewDecision: "Unreviewed",
    ...overrides,
  };
}

describe("markDuplicates", () => {
  it("flags later records with a matching DOI as duplicates of the first", () => {
    const [a, b] = markDuplicates([
      makeArticle({ id: "1", doi: "10.1/same" }),
      makeArticle({ id: "2", doi: "10.1/same" }),
    ]);
    expect(a?.isDuplicate).toBe(false);
    expect(b?.isDuplicate).toBe(true);
  });

  it("falls back to title when the DOI is missing", () => {
    const [, b] = markDuplicates([
      makeArticle({ id: "1", doi: "", title: "Same Title" }),
      makeArticle({ id: "2", doi: "", title: "same title" }),
    ]);
    expect(b?.isDuplicate).toBe(true);
  });

  it("does not throw when doi is undefined", () => {
    expect(() => markDuplicates([makeArticle({ doi: undefined })])).not.toThrow();
  });
});

describe("selectAllArticles", () => {
  it("selects every record", () => {
    const result = selectAllArticles([makeArticle(), makeArticle({ selected: false })]);
    expect(result.every((a) => a.selected)).toBe(true);
  });
});

describe("deselectAllArticles", () => {
  it("deselects every record", () => {
    const result = deselectAllArticles([makeArticle({ selected: true }), makeArticle({ selected: true })]);
    expect(result.every((a) => !a.selected)).toBe(true);
  });
});

describe("selectArticlesById and deselectArticlesById", () => {
  it("only changes records in the target set", () => {
    const selected = selectArticlesById(
      [makeArticle({ id: "1" }), makeArticle({ id: "2" })],
      new Set(["2"]),
    );
    expect(selected.map((article) => article.selected)).toEqual([false, true]);

    const deselected = deselectArticlesById(
      [makeArticle({ id: "1", selected: true }), makeArticle({ id: "2", selected: true })],
      new Set(["2"]),
    );
    expect(deselected.map((article) => article.selected)).toEqual([true, false]);
  });
});

describe("filterArticles", () => {
  it("combines full text, year, include keywords, and exclude keywords with AND logic", () => {
    const articles = [
      makeArticle({
        id: "1",
        title: "Malaria prevention uptake",
        author: "Amina Bello",
        year: "2025",
        abstract: "Caregiver adherence in Nigeria",
        fullTextStatus: "Pulled",
      }),
      makeArticle({
        id: "2",
        title: "Malaria prevention uptake",
        author: "Amina Bello",
        year: "2018",
        abstract: "Caregiver adherence in Nigeria",
        fullTextStatus: "Pulled",
      }),
      makeArticle({
        id: "3",
        title: "Malaria prevention uptake protocol",
        author: "Amina Bello",
        year: "2025",
        abstract: "Caregiver adherence in Nigeria",
        fullTextStatus: "Pulled",
      }),
      makeArticle({
        id: "4",
        title: "Malaria prevention uptake",
        author: "Amina Bello",
        year: "2025",
        abstract: "Caregiver adherence in Nigeria",
        fullTextStatus: "Not pulled",
      }),
    ];

    const result = filterArticles(
      articles,
      {
        recordType: "all",
        fullText: "pulled",
        yearWindow: "5",
        includeKeywords: "malaria, Nigeria",
        excludeKeywords: "protocol",
      },
      2026,
    );

    expect(result.map((article) => article.id)).toEqual(["1"]);
  });

  it("can filter down to unique records only", () => {
    const result = filterArticles(
      [
        makeArticle({ id: "1", doi: "10.1/same" }),
        makeArticle({ id: "2", doi: "10.1/same" }),
        makeArticle({ id: "3", doi: "10.1/other" }),
      ],
      {
        recordType: "unique",
        fullText: "any",
        yearWindow: "any",
        includeKeywords: "",
        excludeKeywords: "",
      },
    );

    expect(result.map((article) => article.id)).toEqual(["1", "3"]);
  });
});

describe("selectUniqueArticles", () => {
  it("selects unique records and deselects duplicates", () => {
    const result = selectUniqueArticles([
      makeArticle({ id: "1", doi: "10.1/same" }),
      makeArticle({ id: "2", doi: "10.1/same" }),
      makeArticle({ id: "3", doi: "10.1/other" }),
    ]);
    expect(result.map((a) => a.selected)).toEqual([true, false, true]);
  });

  it("does not persist the derived isDuplicate flag", () => {
    const [first] = selectUniqueArticles([makeArticle({ doi: "10.1/x" })]);
    expect(first).not.toHaveProperty("isDuplicate");
  });
});

describe("setArticleSelected", () => {
  it("toggles a single record by id", () => {
    const result = setArticleSelected([makeArticle({ id: "1" }), makeArticle({ id: "2" })], "2", true);
    expect(result.find((a) => a.id === "2")?.selected).toBe(true);
    expect(result.find((a) => a.id === "1")?.selected).toBe(false);
  });
});

describe("pullArticleDetails", () => {
  it("retrieves selected records and backfills an abstract", () => {
    const [result] = pullArticleDetails([makeArticle({ selected: true, abstract: "" })]);
    expect(result?.fullTextStatus).toBe("Pulled");
    expect(result?.abstract?.length).toBeGreaterThan(0);
  });

  it("leaves unselected records untouched", () => {
    const [result] = pullArticleDetails([makeArticle({ selected: false })]);
    expect(result?.fullTextStatus).toBe("Not pulled");
  });
});
