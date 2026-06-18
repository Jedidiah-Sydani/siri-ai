import type { Article } from "../types";

function duplicateKey(article: Article) {
  const doi = (article.doi || "").trim().toLowerCase();
  return doi || (article.title || "").trim().toLowerCase();
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
