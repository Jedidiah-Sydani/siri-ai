import { defaultSources } from "../data/constants";
import type { Article, Collaborator, FullTextStatus, Project, ResearchSource, ReviewDecision } from "../types";

interface RawArticle {
  id?: string;
  title?: string;
  source?: string;
  author?: string;
  sourceUrl?: string;
  doi?: string;
  year?: string | number;
  journal?: string;
  abstract?: string;
  selected?: boolean;
  fullTextStatus?: string;
  isDuplicate?: boolean;
  reviewDecision?: string;
}

interface RawSource extends Partial<Omit<ResearchSource, "id">> {
  id?: string;
}

interface RawProject {
  id?: string;
  title?: string;
  theme?: string;
  researchLead?: string;
  framework?: string;
  geography?: string;
  updatedAt?: string;
  researchQuestion?: string;
  archived?: boolean;
  isLocal?: boolean;
  collaborators?: Collaborator[];
  sources?: RawSource[];
  articles?: RawArticle[];
}

const DEFAULT_ARTICLE: Article = {
  id: "",
  title: "",
  source: "",
  author: "",
  sourceUrl: "",
  doi: "",
  year: "",
  selected: false,
  reviewDecision: "Unreviewed",
  fullTextStatus: "Not pulled",
};

function isReviewDecision(value: unknown): value is ReviewDecision {
  return value === "Unreviewed" || value === "Included" || value === "Maybe" || value === "Excluded";
}

function isFullTextStatus(value: unknown): value is FullTextStatus {
  return value === "Not pulled" || value === "Pulled";
}

function normalizeArticle(article: RawArticle): Article {
  const { isDuplicate, ...rest } = article;
  const selected = Boolean(article.selected);
  const reviewDecision =
    !isReviewDecision(article.reviewDecision)
      ? "Unreviewed"
      : article.reviewDecision;
  const fullTextStatus = isFullTextStatus(article.fullTextStatus)
    ? article.fullTextStatus
    : "Not pulled";

  return { ...DEFAULT_ARTICLE, ...rest, selected, reviewDecision, fullTextStatus };
}

export function normalizePaper(paper: RawProject): Project {
  const { archived, ...rest } = paper;
  const existingSources = Array.isArray(paper.sources) ? paper.sources : [];

  const sources = defaultSources.map((baseSource) => {
    const existingSource = existingSources.find((source) => source.id === baseSource.id) || {};
    const { id: _sourceId, ...existingSourceFields } = existingSource;
    const searchTerm =
      typeof existingSource.searchTerm === "string" ? existingSource.searchTerm : baseSource.searchTerm;

    return { ...baseSource, ...existingSourceFields, searchTerm };
  });

  const articles = Array.isArray(paper.articles) ? paper.articles.map(normalizeArticle) : [];

  return {
    id: rest.id || "",
    title: rest.title || "",
    theme: rest.theme || "",
    researchLead: rest.researchLead || "",
    framework: rest.framework || "PICO",
    geography: rest.geography || "",
    updatedAt: rest.updatedAt || "",
    researchQuestion: rest.researchQuestion || "",
    collaborators: Array.isArray(rest.collaborators) ? rest.collaborators : [],
    archived: Boolean(archived),
    isLocal: rest.isLocal,
    articles,
    sources,
  };
}

export function normalizeState(state: { papers?: RawProject[] } | null | undefined): { papers: Project[] } {
  const papers = Array.isArray(state?.papers) ? state.papers.map(normalizePaper) : [];
  return { papers };
}
