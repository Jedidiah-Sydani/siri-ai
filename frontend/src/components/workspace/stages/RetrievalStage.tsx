import { Download } from "lucide-react";
import { pullArticleDetails } from "../../../lib/articles";
import { getSelectedArticles } from "../../../lib/pipeline";
import EmptyState from "../../EmptyState";
import type { StageProps } from "../../../types";

export default function RetrievalStage({ paper, onUpdatePaper }: StageProps) {
  const selectedArticles = getSelectedArticles(paper);

  function pullDetails() {
    onUpdatePaper((current) => ({
      ...current,
      articles: pullArticleDetails(current.articles),
      updatedAt: "Just now",
    }));
  }

  return (
    <>
      <div className="stage-actions">
        <button className="primary icon-button" type="button" onClick={pullDetails}>
          <Download size={17} />
          Pull abstracts/articles
        </button>
      </div>
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
              <span className={`status-pill ${article.fullTextStatus === "Pulled" ? "good" : ""}`}>
                {article.fullTextStatus}
              </span>
            </div>
            <p>{article.abstract || "Abstract pending."}</p>
          </article>
        ))}
        {!selectedArticles.length && <EmptyState label="No selected articles" />}
      </div>
    </>
  );
}
