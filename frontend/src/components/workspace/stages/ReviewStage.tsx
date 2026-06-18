import { getSelectedArticles } from "../../../lib/pipeline";
import EmptyState from "../../EmptyState";
import type { ReviewDecision, StageProps } from "../../../types";

export default function ReviewStage({ paper, onUpdatePaper }: StageProps) {
  const selectedArticles = getSelectedArticles(paper);

  function setDecision(articleId: string, reviewDecision: ReviewDecision) {
    onUpdatePaper((current) => ({
      ...current,
      articles: current.articles.map((article) =>
        article.id === articleId ? { ...article, reviewDecision } : article,
      ),
      updatedAt: "Just now",
    }));
  }

  return (
    <div className="article-list">
      {selectedArticles.map((article) => (
        <article className="review-card" key={article.id}>
          <div className="article-head">
            <div>
              <h3>{article.title}</h3>
              <p>
                {article.journal} | {article.year} | {article.doi}
              </p>
            </div>
            <span className="status-pill">{article.reviewDecision}</span>
          </div>
          <p>{article.abstract || "Abstract pending."}</p>
          <div className="review-actions">
            <button type="button" onClick={() => setDecision(article.id, "Included")}>
              Include
            </button>
            <button type="button" onClick={() => setDecision(article.id, "Maybe")}>
              Maybe
            </button>
            <button type="button" onClick={() => setDecision(article.id, "Excluded")}>
              Exclude
            </button>
          </div>
        </article>
      ))}
      {!selectedArticles.length && <EmptyState label="No articles to review" />}
    </div>
  );
}
