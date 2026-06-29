import EmptyState from "./EmptyState";
import type { Article } from "../types";

interface ArticleTableProps {
  articles: Article[];
  selectable?: boolean;
  onToggleSelect?: (articleId: string, selected: boolean) => void;
  showSource?: boolean;
  showAiScreening?: boolean;
  titleHeader?: string;
}

function doiUrl(doi: string) {
  const trimmedDoi = doi.trim();
  return trimmedDoi ? `https://doi.org/${trimmedDoi}` : "";
}

export default function ArticleTable({
  articles,
  selectable = false,
  onToggleSelect,
  showSource = true,
  showAiScreening = false,
  titleHeader = "Title",
}: ArticleTableProps) {
  if (!articles.length) return <EmptyState label="No records" />;

  function openArticle(article: Article) {
    if (!article.sourceUrl) return;
    window.open(article.sourceUrl, "_blank", "noopener,noreferrer");
  }

  function openDoi(doi: string) {
    const url = doiUrl(doi);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {showAiScreening && <th>AI screening</th>}
            <th>{titleHeader}</th>
            <th>Author</th>
            {showSource && <th>Source</th>}
            <th>DOI</th>
            <th>Year</th>
            {selectable && (
              <th className="checkbox-col">
                <span className="sr-only">Selected</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr
              key={article.id}
              className={article.isDuplicate ? "muted-row" : ""}
            >
              {showAiScreening && (
                <td className="ai-screening-cell">
                  {article.aiScreening ? (
                    <span className="ai-screening-result">
                      <span className={`ai-screening-badge ${article.aiScreening.recommendation.toLowerCase().replaceAll(" ", "-")}`}>
                        {article.aiScreening.recommendation}
                      </span>
                      <span>{article.aiScreening.reason}</span>
                    </span>
                  ) : (
                    <span className="muted-text">Not screened</span>
                  )}
                </td>
              )}
              <td>
                {article.sourceUrl ? (
                  <button
                    className="table-link title-link"
                    type="button"
                    onClick={() => openArticle(article)}
                    title="Open source"
                  >
                    {article.title}
                  </button>
                ) : (
                  article.title
                )}
              </td>
              <td>{article.author}</td>
              {showSource && <td>{article.source}</td>}
              <td>
                {article.doi ? (
                  <button
                    className="table-link doi-link"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openDoi(article.doi);
                    }}
                    title={`Open DOI ${article.doi}`}
                  >
                    {article.doi}
                  </button>
                ) : (
                  <span className="muted-text">Not available</span>
                )}
              </td>
              <td>{article.year}</td>
              {selectable && (
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={Boolean(article.selected)}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => onToggleSelect?.(article.id, event.target.checked)}
                    aria-label={`Select ${article.title}`}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
