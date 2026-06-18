import type { Article } from "../types";

export type FullTextFilter = "any" | "pulled" | "notPulled";
export type YearFilter = "any" | "1" | "5" | "10";
export type RecordTypeFilter = "all" | "unique";

export interface SelectionFilters {
  recordType: RecordTypeFilter;
  fullText: FullTextFilter;
  yearWindow: YearFilter;
  includeKeywords: string;
  excludeKeywords: string;
}

function duplicateKey(article: Article) {
  const doi = (article.doi || "").trim().toLowerCase();
  return doi || (article.title || "").trim().toLowerCase();
}

function keywordList(value: string): string[] {
  return value
    .split(",")
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
}

function searchableArticleText(article: Article): string {
  return [
    article.title,
    article.author,
    article.source,
    article.doi,
    article.year,
    article.journal,
    article.abstract,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function articleYear(article: Article): number | null {
  const match = String(article.year || "").match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

// Annotate each record with `isDuplicate` (by DOI, falling back to title). The first
// occurrence of a key is the unique one; later matches are duplicates. Derived only —
// never persisted.
export function markDuplicates(articles: Article[]): Article[] {
  const seen = new Set();
  return articles.map((article) => {
    const key = duplicateKey(article);
    const isDuplicate = Boolean(key && seen.has(key));
    if (key) seen.add(key);
    return { ...article, isDuplicate };
  });
}

export function selectAllArticles(articles: Article[]): Article[] {
  return articles.map((article) => ({ ...article, selected: true }));
}

export function deselectAllArticles(articles: Article[]): Article[] {
  return articles.map((article) => ({ ...article, selected: false }));
}

export function selectArticlesById(articles: Article[], articleIds: Set<string>): Article[] {
  return articles.map((article) => (
    articleIds.has(article.id) ? { ...article, selected: true } : article
  ));
}

export function deselectArticlesById(articles: Article[], articleIds: Set<string>): Article[] {
  return articles.map((article) => (
    articleIds.has(article.id) ? { ...article, selected: false } : article
  ));
}

// Select the unique records and deselect the duplicates.
export function selectUniqueArticles(articles: Article[]): Article[] {
  return markDuplicates(articles).map(({ isDuplicate, ...article }) => ({
    ...article,
    selected: !isDuplicate,
  }));
}

export function setArticleSelected(
  articles: Article[],
  articleId: string,
  selected: boolean,
): Article[] {
  return articles.map((article) =>
    article.id === articleId ? { ...article, selected } : article,
  );
}

export function filterArticles(
  articles: Article[],
  filters: SelectionFilters,
  currentYear = new Date().getFullYear(),
): Article[] {
  const includes = keywordList(filters.includeKeywords);
  const excludes = keywordList(filters.excludeKeywords);
  const minimumYear =
    filters.yearWindow === "any" ? null : currentYear - Number(filters.yearWindow) + 1;

  return markDuplicates(articles).filter((article) => {
    if (filters.recordType === "unique" && article.isDuplicate) return false;

    if (filters.fullText === "pulled" && article.fullTextStatus !== "Pulled") return false;
    if (filters.fullText === "notPulled" && article.fullTextStatus !== "Not pulled") return false;

    if (minimumYear !== null) {
      const year = articleYear(article);
      if (year === null || year < minimumYear) return false;
    }

    const text = searchableArticleText(article);
    if (includes.length && !includes.every((keyword) => text.includes(keyword))) return false;
    if (excludes.some((keyword) => text.includes(keyword))) return false;

    return true;
  });
}

// Mark the selected records as retrieved and backfill a placeholder abstract.
export function pullArticleDetails(articles: Article[]): Article[] {
  return articles.map((article) => {
    if (!article.selected) return article;
    return {
      ...article,
      fullTextStatus: "Pulled",
      abstract:
        article.abstract ||
        `This abstract summarizes evidence relevant to ${article.title.toLowerCase()}, including study context, participants, methods, core findings, and implementation implications.`,
    };
  });
}
