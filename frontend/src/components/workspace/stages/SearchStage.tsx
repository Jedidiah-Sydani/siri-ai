import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { generateSearchTerm, searchSource } from "../../../services/workspaceApi";
import ArticleTable from "../../ArticleTable";
import EmptyState from "../../EmptyState";
import type { ResearchSource, StageProps } from "../../../types";

interface SearchState {
  status: "idle" | "loading" | "error";
  error: string | null;
}

function formatRunDateTime(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export default function SearchStage({ paper, onUpdatePaper }: StageProps) {
  const [activeSourceId, setActiveSourceId] = useState(paper.sources[0]?.id || "pubmed");
  const [searchState, setSearchState] = useState<SearchState>({ status: "idle", error: null });
  const [generateState, setGenerateState] = useState<SearchState>({ status: "idle", error: null });
  // Falls back to the first source if the selected id no longer exists, so no
  // effect-driven correction of `activeSourceId` is needed.
  const activeSource = paper.sources.find((source) => source.id === activeSourceId) || paper.sources[0];
  const activeArticles = paper.articles.filter((article) => article.source === activeSource?.name);

  function updateSource(sourceId: string, updater: (source: ResearchSource) => ResearchSource) {
    onUpdatePaper((current) => ({
      ...current,
      sources: current.sources.map((source) => (source.id === sourceId ? updater(source) : source)),
    }));
  }

  function updateSearchTerm(searchTerm: string) {
    if (!activeSource) return;
    updateSource(activeSource.id, (source) => ({
      ...source,
      searchTerm,
    }));
  }

  async function runSearch() {
    if (!activeSource) return;
    setSearchState({ status: "loading", error: null });

    try {
      const response = await searchSource(activeSource);
      const runDateTime = formatRunDateTime(new Date());

      onUpdatePaper((current) => {
        const source =
          current.sources.find((item) => item.id === response.sourceId) || current.sources[0];
        const retainedArticles = current.articles.filter(
          (article) => article.source !== response.sourceName,
        );
        const sources = current.sources.map((item) =>
          item.id === source.id
            ? {
                ...item,
                enabled: true,
                resultCount: response.articles.length,
                lastRun: runDateTime,
              }
            : item,
        );

        return {
          ...current,
          articles: [...retainedArticles, ...response.articles],
          sources,
          updatedAt: "Just now",
        };
      });

      setSearchState({ status: "idle", error: null });
    } catch (error) {
      setSearchState({
        status: "error",
        error: error instanceof Error ? error.message : "Unable to fetch search results.",
      });
    }
  }

  async function runSearchTermGeneration() {
    if (!activeSource) return;
    setGenerateState({ status: "loading", error: null });

    try {
      const response = await generateSearchTerm(paper, activeSource);
      updateSource(response.sourceId, (source) => ({
        ...source,
        searchTerm: response.searchTerm,
      }));
      setGenerateState({ status: "idle", error: null });
    } catch (error) {
      setGenerateState({
        status: "error",
        error: error instanceof Error ? error.message : "Unable to generate a search term.",
      });
    }
  }

  return (
    <>
      <div className="source-tabs" role="tablist" aria-label="Search sources">
        {paper.sources.map((source) => (
          <button
            className={`source-tab ${source.id === activeSource?.id ? "active" : ""} ${source.enabled ? "enabled" : ""}`}
            key={source.id}
            type="button"
            role="tab"
            aria-selected={source.id === activeSource?.id}
            onClick={() => setActiveSourceId(source.id)}
          >
            <strong>{source.name}</strong>
            <small>{source.resultCount} records</small>
          </button>
        ))}
      </div>

      {activeSource ? (
        <div className="source-workspace">
          <div className="source-workspace-head">
            <div>
              <h3>{activeSource.name}</h3>
              <p>{activeSource.lastRun ? `Last run ${activeSource.lastRun}` : "Not run"}</p>
            </div>
            <div className="source-actions">
              <button
                className="secondary-action icon-button"
                type="button"
                onClick={runSearchTermGeneration}
                disabled={generateState.status === "loading"}
              >
                {generateState.status === "loading" ? (
                  <span className="button-spinner" aria-hidden="true" />
                ) : (
                  <Sparkles size={17} />
                )}
                {generateState.status === "loading" ? "Generating..." : "Generate search term"}
              </button>
              <button
                className="fetch-button icon-button"
                type="button"
                onClick={runSearch}
                disabled={!activeSource.searchTerm.trim() || searchState.status === "loading"}
              >
                {searchState.status === "loading" ? (
                  <span className="button-spinner" aria-hidden="true" />
                ) : (
                  <Search size={17} />
                )}
                {searchState.status === "loading" ? "Fetching..." : "Fetch"}
              </button>
            </div>
          </div>

          {(searchState.status === "error" || generateState.status === "error") && (
            <div className="source-error" role="alert">
              {searchState.error || generateState.error}
            </div>
          )}

          <label className="single-search-term">
            <span className="sr-only">{activeSource.name} search string</span>
            <textarea
              value={activeSource.searchTerm}
              onChange={(event) => updateSearchTerm(event.target.value)}
              placeholder={`${activeSource.name} search string`}
              rows={3}
            />
          </label>
        </div>
      ) : (
        <EmptyState label="No sources" />
      )}

      <div className="source-results">
        <h3>{activeSource ? `${activeSource.name} results (${activeArticles.length})` : "Results (0)"}</h3>
        <ArticleTable articles={activeArticles} showSource={false} />
      </div>
    </>
  );
}
