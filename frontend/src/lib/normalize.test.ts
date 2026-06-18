import { describe, expect, it } from "vitest";
import { normalizePaper, normalizeState } from "./normalize";
import { defaultSources } from "../data/constants";

describe("normalizePaper", () => {
  it("backfills every default source and a missing articles array", () => {
    const result = normalizePaper({ id: "p", title: "T" });
    expect(result.articles).toEqual([]);
    expect(result.sources.map((s) => s.id)).toEqual(defaultSources.map((s) => s.id));
  });

  it("keeps an existing per-source search term", () => {
    const paper = {
      id: "p",
      sources: [{ id: "pubmed", name: "PubMed", searchTerm: "kept" }],
      articles: [],
    };
    expect(normalizePaper(paper).sources[0].searchTerm).toBe("kept");
  });
});

describe("normalizeArticle defaults (via normalizePaper)", () => {
  it("defaults a missing `selected` flag to false", () => {
    const paper = {
      id: "p",
      articles: [
        { id: "1", doi: "10.1/a" },
        { id: "2", doi: "10.1/b" },
      ],
    };
    const [first, second] = normalizePaper(paper).articles;
    expect(first.selected).toBe(false);
    expect(second.selected).toBe(false);
  });

  it("defaults a missing author to an empty string", () => {
    const paper = { id: "p", articles: [{ id: "1", doi: "10.1/a" }] };
    expect(normalizePaper(paper).articles[0].author).toBe("");
  });

  it("keeps an explicit `selected` flag and drops derived duplicate fields", () => {
    const paper = {
      id: "p",
      articles: [{ id: "1", doi: "10.1/a", selected: false, isDuplicate: true }],
    };
    const [article] = normalizePaper(paper).articles;
    expect(article.selected).toBe(false);
    expect(article).not.toHaveProperty("isDuplicate");
  });

  it("defaults invalid review decisions to 'Unreviewed'", () => {
    const paper = { id: "p", articles: [{ id: "1", reviewDecision: "Needs discussion" }] };
    expect(normalizePaper(paper).articles[0].reviewDecision).toBe("Unreviewed");
  });
});

describe("normalizeState", () => {
  it("returns an empty papers array for malformed input", () => {
    expect(normalizeState(null)).toEqual({ papers: [] });
    expect(normalizeState({})).toEqual({ papers: [] });
  });
});
