import { normalizePaper } from "../lib/normalize";
import type {
  AuthResponse,
  GenerateSearchTermResponse,
  Project,
  ProjectSummary,
  ResearchSource,
  SearchResponse,
  User,
} from "../types";

const AUTH_TOKEN_KEY = "siriResearchAuthToken";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function storeAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

function authHeaders(extraHeaders: Record<string, string> = {}) {
  const token = getStoredAuthToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

async function createApiError(response: Response, fallbackMessage: string) {
  let payload: { detail?: string } = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  return new ApiError(payload.detail || fallbackMessage, response.status);
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    headers: authHeaders(),
    signal,
  });

  if (!response.ok) {
    throw await createApiError(response, `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw await createApiError(response, `Login failed with status ${response.status}`);
  }

  const authResponse = await response.json() as AuthResponse;
  storeAuthToken(authResponse.token);
  return authResponse;
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<void> {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
  });

  if (!response.ok) {
    throw await createApiError(response, `Password change failed with status ${response.status}`);
  }
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
    headers: authHeaders({ "Content-Type": "application/json" }),
    signal,
    body: JSON.stringify({
      sourceId: source.id,
      sourceName: source.name,
      searchTerm: source.searchTerm,
    }),
  });

  if (!response.ok) {
    throw await createApiError(response, `Search failed with status ${response.status}`);
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
    headers: authHeaders({ "Content-Type": "application/json" }),
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
    throw await createApiError(response, `Search term generation failed with status ${response.status}`);
  }

  return response.json() as Promise<GenerateSearchTermResponse>;
}
