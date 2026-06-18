import { useMemo, useState } from "react";
import { Filter, ListChecks, Square } from "lucide-react";
import {
  deselectArticlesById,
  filterArticles,
  markDuplicates,
  selectArticlesById,
  setArticleSelected,
  type SelectionFilters,
} from "../../../lib/articles";
import { getSelectedArticles } from "../../../lib/pipeline";
import ArticleTable from "../../ArticleTable";
import type { Article, StageProps } from "../../../types";

export default function DedupeStage({ paper, onUpdatePaper }: StageProps) {
  const [filters, setFilters] = useState<SelectionFilters>({
    recordType: "all",
    fullText: "any",
    yearWindow: "any",
    includeKeywords: "",
    excludeKeywords: "",
  });
  const total = paper.articles.length;
  const selected = getSelectedArticles(paper).length;
  const filteredArticles = useMemo(
    () => filterArticles(paper.articles, filters),
    [filters, paper.articles],
  );
  const annotatedArticles = markDuplicates(filteredArticles);
  const filteredIds = new Set(filteredArticles.map((article) => article.id));

  function applySelection(transform: (articles: Article[]) => Article[]) {
    onUpdatePaper((current) => ({
      ...current,
      articles: transform(current.articles),
      updatedAt: "Just now",
    }));
  }

  return (
    <>
      <div className="selection-filters">
        <div className="selection-filters-title">
          <Filter size={17} />
          <strong>Filters</strong>
        </div>
        <div className="selection-filter-grid">
          <label>
            Duplicates
            <select
              value={filters.recordType}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  recordType: event.target.value as SelectionFilters["recordType"],
                }))
              }
            >
              <option value="all">All records</option>
              <option value="unique">Unique only</option>
            </select>
          </label>
          <label>
            Full text
            <select
              value={filters.fullText}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  fullText: event.target.value as SelectionFilters["fullText"],
                }))
              }
            >
              <option value="any">Any status</option>
              <option value="pulled">Pulled</option>
              <option value="notPulled">Not pulled</option>
            </select>
          </label>
          <label>
            Year
            <select
              value={filters.yearWindow}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  yearWindow: event.target.value as SelectionFilters["yearWindow"],
                }))
              }
            >
              <option value="any">Any year</option>
              <option value="1">Last 1 year</option>
              <option value="5">Last 5 years</option>
              <option value="10">Last 10 years</option>
            </select>
          </label>
          <label>
            Include keywords
            <input
              value={filters.includeKeywords}
              onChange={(event) =>
                setFilters((current) => ({ ...current, includeKeywords: event.target.value }))
              }
              placeholder="keyword, phrase"
            />
          </label>
          <label>
            Exclude keywords
            <input
              value={filters.excludeKeywords}
              onChange={(event) =>
                setFilters((current) => ({ ...current, excludeKeywords: event.target.value }))
              }
              placeholder="keyword, phrase"
            />
          </label>
        </div>
      </div>
      <div className="stage-actions">
        <button
          className="primary icon-button"
          type="button"
          onClick={() => applySelection((articles) => selectArticlesById(articles, filteredIds))}
          disabled={!filteredArticles.length}
        >
          <ListChecks size={17} />
          Select all
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => applySelection((articles) => deselectArticlesById(articles, filteredIds))}
          disabled={!filteredArticles.length}
        >
          <Square size={17} />
          Deselect all
        </button>
        <span className="selection-count">{selected} selected</span>
      </div>
      <ArticleTable
        articles={annotatedArticles}
        selectable
        titleHeader={`Title (${filteredArticles.length}/${total})`}
        onToggleSelect={(articleId: string, value: boolean) =>
          applySelection((articles) => setArticleSelected(articles, articleId, value))
        }
      />
    </>
  );
}
