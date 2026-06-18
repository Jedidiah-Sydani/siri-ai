import { CopyCheck, ListChecks, Square } from "lucide-react";
import {
  deselectAllArticles,
  markDuplicates,
  selectAllArticles,
  selectUniqueArticles,
  setArticleSelected,
} from "../../../lib/articles";
import { getSelectedArticles, getUniqueCount } from "../../../lib/pipeline";
import ArticleTable from "../../ArticleTable";
import Metric from "../../Metric";
import type { Article, StageProps } from "../../../types";

export default function DedupeStage({ paper, onUpdatePaper }: StageProps) {
  const total = paper.articles.length;
  const unique = getUniqueCount(paper.articles);
  const selected = getSelectedArticles(paper).length;
  const notSelected = total - selected;
  const annotatedArticles = markDuplicates(paper.articles);

  function applySelection(transform: (articles: Article[]) => Article[]) {
    onUpdatePaper((current) => ({
      ...current,
      articles: transform(current.articles),
      updatedAt: "Just now",
    }));
  }

  return (
    <>
      <div className="metric-grid metric-grid-4">
        <Metric label="Total" value={total} />
        <Metric label="Unique" value={unique} />
        <Metric label="Selected" value={selected} />
        <Metric label="Not selected" value={notSelected} />
      </div>
      <div className="stage-actions">
        <button
          className="primary icon-button"
          type="button"
          onClick={() => applySelection(selectAllArticles)}
        >
          <ListChecks size={17} />
          Select all
        </button>
        <button
          className="primary icon-button"
          type="button"
          onClick={() => applySelection(selectUniqueArticles)}
        >
          <CopyCheck size={17} />
          Select unique
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => applySelection(deselectAllArticles)}
        >
          <Square size={17} />
          Deselect all
        </button>
      </div>
      <ArticleTable
        articles={annotatedArticles}
        selectable
        onToggleSelect={(articleId: string, value: boolean) =>
          applySelection((articles) => setArticleSelected(articles, articleId, value))
        }
      />
    </>
  );
}
