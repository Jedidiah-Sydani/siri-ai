import { normalizePaper } from "../lib/normalize";
import type {
  GenerateSearchTermResponse,
  Project,
  ProjectSummary,
  ResearchSource,
  SearchResponse,
  User,
} from "../types";

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function loadWorkspace(signal?: AbortSignal): Promise<{ user: User; papers: ProjectSummary[] }> {
  const [user, projects] = await Promise.all([
    getJson<User>("/api/users/me", signal),
    getJson<ProjectSummary[]>("/api/projects", signal),
  ]);

  return { user, papers: projects };
}

export async function loadProject(projectId: string, signal?: AbortSignal): Promise<Project> {
  const project = await getJson<Partial<Project>>(`/api/projects/${projectId}`, signal);
  return normalizePaper(project);
}

export async function searchSource(
  source: Pick<ResearchSource, "id" | "name" | "searchTerm">,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      sourceId: source.id,
      sourceName: source.name,
      searchTerm: source.searchTerm,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch((): { detail?: string } => ({}));
    throw new Error(payload.detail || `Search failed with status ${response.status}`);
  }

  return response.json() as Promise<SearchResponse>;
}

export async function generateSearchTerm(
  project: Pick<Project, "title" | "theme" | "framework" | "geography" | "researchQuestion">,
  source: Pick<ResearchSource, "id" | "name">,
  signal?: AbortSignal,
): Promise<GenerateSearchTermResponse> {
  const response = await fetch("/api/search/terms", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      sourceId: source.id,
      sourceName: source.name,
      title: project.title,
      theme: project.theme,
      framework: project.framework,
      geography: project.geography,
      researchQuestion: project.researchQuestion,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch((): { detail?: string } => ({}));
    throw new Error(payload.detail || `Search term generation failed with status ${response.status}`);
  }

  return response.json() as Promise<GenerateSearchTermResponse>;
}
