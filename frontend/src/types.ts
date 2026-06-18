import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type StageId = "idea" | "search" | "dedupe" | "retrieval" | "review";
export type SourceId = "pubmed" | "scholar" | "scopus";
export type ProjectFilter = "all" | "progress" | "complete" | "archived";
export type ReviewDecision = "Unreviewed" | "Included" | "Maybe" | "Excluded";
export type FullTextStatus = "Not pulled" | "Pulled";
export type ProjectStatus = "Ideation" | "In progress" | "Complete" | "Archived";
export type RequestStatus = "idle" | "loading" | "ready" | "error";

export interface User {
  id: string;
  name: string;
  initials: string;
  department: string;
}

export interface Collaborator {
  id: string;
  name: string;
  initials: string;
}

export interface ResearchSource {
  id: SourceId;
  name: string;
  enabled: boolean;
  resultCount: number;
  lastRun: string;
  searchTerm: string;
}

export interface Article {
  id: string;
  title: string;
  source: string;
  author: string;
  sourceUrl: string;
  doi: string;
  year: string | number;
  journal?: string;
  abstract?: string;
  selected: boolean;
  reviewDecision: ReviewDecision;
  fullTextStatus: FullTextStatus;
  isDuplicate?: boolean;
}

export interface Project {
  id: string;
  title: string;
  theme: string;
  researchLead: string;
  framework: string;
  geography: string;
  updatedAt: string;
  researchQuestion: string;
  sources: ResearchSource[];
  articles: Article[];
  collaborators: Collaborator[];
  archived?: boolean;
  isLocal?: boolean;
}

export interface ProjectSummary {
  id: string;
  title: string;
  theme: string;
  researchLead: string;
  framework: string;
  geography: string;
  updatedAt: string;
  stageId: StageId;
  stageLabel: string;
  stageNumber: number;
  progress: number;
  status: ProjectStatus;
  collaborators: Collaborator[];
  archived?: boolean;
  isLocal?: boolean;
}

export interface StageDefinition {
  id: StageId;
  label: string;
  icon: LucideIcon;
}

export interface StageInfo {
  id: StageId;
  label: string;
  number: number;
  progress: number;
}

export type ProjectUpdater = (project: Project) => Project;
export type UpdatePaper = (updater: ProjectUpdater) => void;

export interface StageProps {
  paper: Project;
  onUpdatePaper: UpdatePaper;
}

export interface WorkspaceContextValue {
  papers: ProjectSummary[];
  user: User;
  getPaper: (paperId?: string) => Project | undefined;
  fetchProject: (paperId: string, signal?: AbortSignal) => Promise<Project>;
  createPaper: (formData: FormData) => string;
  updatePaper: (paperId: string, updater: ProjectUpdater) => void;
}

export interface SearchResponse {
  sourceId: SourceId;
  sourceName: string;
  articles: Article[];
}

export interface GenerateSearchTermResponse {
  sourceId: SourceId;
  sourceName: string;
  searchTerm: string;
}

export interface ModalProps {
  title: string;
  titleId?: string;
  onClose: () => void;
  children: ReactNode;
}
