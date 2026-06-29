import { defaultSources, isFrameworkId } from "../data/constants";
import type { AiScreeningRecommendation, Article, Collaborator, FrameworkFields, FullTextStatus, Project, ResearchSource, ReviewDecision } from "../types";

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
  aiScreening?: {
    recommendation?: string;
    reason?: string;
  };
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
  frameworkFields?: FrameworkFields;
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

function isAiScreeningRecommendation(value: unknown): value is AiScreeningRecommendation {
  return value === "Likely include" || value === "Likely exclude" || value === "Unclear";
}

function normalizeAiScreening(value: RawArticle["aiScreening"]): Article["aiScreening"] {
  if (!value || typeof value !== "object") return undefined;
  if (!isAiScreeningRecommendation(value.recommendation)) return undefined;
  return {
    recommendation: value.recommendation,
    reason: typeof value.reason === "string" ? value.reason.trim() : "",
  };
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

  return {
    ...DEFAULT_ARTICLE,
    ...rest,
    selected,
    reviewDecision,
    fullTextStatus,
    aiScreening: normalizeAiScreening(article.aiScreening),
  };
}

function normalizeFrameworkFields(value: unknown): FrameworkFields {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, fieldValue]) => typeof fieldValue === "string")
      .map(([key, fieldValue]) => [key, fieldValue.trim()]),
  ) as FrameworkFields;
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
    framework: isFrameworkId(rest.framework) ? rest.framework : "PICO",
    frameworkFields: normalizeFrameworkFields(rest.frameworkFields),
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
