import EmptyState from "./EmptyState";
import type { Article } from "../types";

interface ArticleTableProps {
  articles: Article[];
  selectable?: boolean;
  onToggleSelect?: (articleId: string, selected: boolean) => void;
  showSource?: boolean;
}

export default function ArticleTable({
  articles,
  selectable = false,
  onToggleSelect,
  showSource = true,
}: ArticleTableProps) {
  if (!articles.length) return <EmptyState label="No records" />;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Title</th>
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
            <tr key={article.id} className={article.isDuplicate ? "muted-row" : ""}>
              <td>{article.title}</td>
              <td>{article.author}</td>
              {showSource && <td>{article.source}</td>}
              <td>{article.doi}</td>
              <td>{article.year}</td>
              {selectable && (
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={Boolean(article.selected)}
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
