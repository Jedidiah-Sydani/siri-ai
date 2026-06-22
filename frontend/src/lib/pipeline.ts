import { getFrameworkDefinition, stages, stageHomeLabels, projectStatus } from "../data/constants";
import type { Article, Project, ProjectFilter, ProjectStatus, StageId, StageInfo } from "../types";

const REVIEW_DECISIONS = ["Included", "Maybe", "Excluded"];

export function getStageIndex(stageId: StageId): number {
  return stages.findIndex((stage) => stage.id === stageId);
}

export function isValidStageId(stageId: string | undefined): stageId is StageId {
  return Boolean(stageId && stages.some((stage) => stage.id === stageId));
}

// Records the user has chosen to carry forward (retrieval, review, summary all use these).
export function getSelectedArticles(paper: Project): Article[] {
  return paper.articles.filter((article) => article.selected);
}

// Count of distinct records by DOI (falling back to title) — the "Unique" statistic.
export function getUniqueCount(articles: Article[]): number {
  const seen = new Set();
  let count = 0;
  for (const article of articles) {
    const doi = (article.doi || "").trim().toLowerCase();
    const key = doi || (article.title || "").trim().toLowerCase();
    if (!key) {
      count += 1;
    } else if (!seen.has(key)) {
      seen.add(key);
      count += 1;
    }
  }
  return count;
}

function isReviewed(article: Article): boolean {
  return REVIEW_DECISIONS.includes(article.reviewDecision);
}

// Search strings live on each source; the paper-level list is always derived, never stored.
export function getAllSearchTerms(paper: Project): string[] {
  const terms = (paper.sources || [])
    .map((source) => source.searchTerm.trim())
    .filter(Boolean);
  return [...new Set(terms)];
}

// The furthest stage the paper has reached, inferred from its data.
export function getPaperStage(paper: Project): StageId {
  const selected = getSelectedArticles(paper);
  if (selected.some(isReviewed)) return "review";
  if (selected.some((article) => article.fullTextStatus === "Pulled")) return "retrieval";
  if (paper.articles.some((article) => article.selected)) return "dedupe";
  if (paper.articles.length || getAllSearchTerms(paper).length) return "search";
  return "idea";
}

export function isStageComplete(paper: Project, stageId: StageId): boolean {
  if (stageId === "idea") {
    const requiredFields = getFrameworkDefinition(paper.framework).fields;
    return Boolean(
      paper.title &&
        paper.researchQuestion &&
        requiredFields.every((field) => paper.frameworkFields[field.id]?.trim()),
    );
  }
  if (stageId === "search") return paper.articles.length > 0;
  if (stageId === "dedupe") return paper.articles.some((article) => article.selected);
  if (stageId === "retrieval") {
    return getSelectedArticles(paper).some((article) => article.fullTextStatus === "Pulled");
  }
  if (stageId === "review") {
    return getSelectedArticles(paper).some(isReviewed);
  }
  return false;
}

// Status is fully derived from pipeline progress, so it can never drift from the data.
export function getProjectStatus(paper: Project): ProjectStatus {
  if (paper.archived) return projectStatus.ARCHIVED;

  const stageId = getPaperStage(paper);
  if (stageId === "idea") return projectStatus.IDEA;

  const selected = getSelectedArticles(paper);
  const fullyReviewed = stageId === "review" && selected.length > 0 && selected.every(isReviewed);

  return fullyReviewed ? projectStatus.COMPLETE : projectStatus.IN_PROGRESS;
}

export function getStageInfo(paper: Project): StageInfo {
  const stageId = getPaperStage(paper);
  const index = getStageIndex(stageId);

  return {
    id: stageId,
    label: stageHomeLabels[stageId] || stages[index]?.label || stageId,
    number: index + 1,
    progress: Math.max(1, Math.round(((index + 1) / stages.length) * 100)),
  };
}

// Stage shown in the workspace: the URL value when valid, otherwise the paper's furthest stage.
export function resolveActiveStage(stageId: string | undefined, paper: Project): StageId {
  return isValidStageId(stageId) ? stageId : getPaperStage(paper);
}

export function matchesProjectFilter(paper: Project, filter: ProjectFilter): boolean {
  if (filter === "archived") return Boolean(paper.archived);
  if (paper.archived) return false;
  if (filter === "all") return true;
  const status = getProjectStatus(paper);
  if (filter === "progress") return status === projectStatus.IN_PROGRESS;
  if (filter === "complete") return status === projectStatus.COMPLETE;
  return true;
}
