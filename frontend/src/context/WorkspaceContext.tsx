import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { defaultSources } from "../data/constants";
import { getProjectStatus, getStageInfo } from "../lib/pipeline";
import { uid } from "../lib/utils";
import { ApiError, loadProject, loadWorkspace } from "../services/workspaceApi";
import type {
  Project,
  ProjectSummary,
  ProjectUpdater,
  RequestStatus,
  User,
  WorkspaceContextValue,
} from "../types";

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceState {
  papers: ProjectSummary[];
  projectDetails: Record<string, Project>;
  user: User | null;
  status: Exclude<RequestStatus, "idle">;
  error: Error | null;
}

interface WorkspaceProviderProps {
  children: ReactNode;
  onAuthExpired: () => void;
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function WorkspaceProvider({ children, onAuthExpired }: WorkspaceProviderProps) {
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    papers: [],
    projectDetails: {},
    user: null,
    status: "loading",
    error: null,
  });
  const { papers, projectDetails, user, status, error } = workspace;
  const projectDetailsRef = useRef(projectDetails);

  useEffect(() => {
    projectDetailsRef.current = projectDetails;
  }, [projectDetails]);

  useEffect(() => {
    const controller = new AbortController();

    loadWorkspace(controller.signal)
      .then(({ papers: loadedPapers, user: loadedUser }) => {
        setWorkspace({
          papers: loadedPapers,
          projectDetails: {},
          user: loadedUser,
          status: "ready",
          error: null,
        });
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        if (loadError instanceof ApiError && loadError.status === 401) {
          onAuthExpired();
          return;
        }
        const error = loadError instanceof Error ? loadError : new Error("The research API could not be reached.");
        setWorkspace((current) => ({
          ...current,
          status: "error",
          error,
        }));
      });

    return () => controller.abort();
  }, [onAuthExpired]);

  const summarizePaper = useCallback((paper: Project, extra: Partial<ProjectSummary> = {}): ProjectSummary => {
    const stage = getStageInfo(paper);
    return {
      id: paper.id,
      title: paper.title,
      theme: paper.theme,
      researchLead: paper.researchLead,
      framework: paper.framework,
      geography: paper.geography,
      updatedAt: paper.updatedAt,
      stageId: stage.id,
      stageLabel: stage.label,
      stageNumber: stage.number,
      progress: stage.progress,
      status: getProjectStatus(paper),
      collaborators: paper.collaborators,
      archived: Boolean(paper.archived),
      ...extra,
    };
  }, [onAuthExpired]);

  const fetchProject = useCallback(async (paperId: string, signal?: AbortSignal) => {
    const localProject = projectDetailsRef.current[paperId];
    if (localProject?.isLocal) return localProject;

    let project: Project;
    try {
      project = await loadProject(paperId, signal);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onAuthExpired();
      }
      throw error;
    }
    projectDetailsRef.current = {
      ...projectDetailsRef.current,
      [paperId]: project,
    };
    setWorkspace((current) => ({
      ...current,
      projectDetails: {
        ...current.projectDetails,
        [paperId]: project,
      },
    }));
    return project;
  }, []);

  const updatePaper = useCallback((paperId: string, updater: ProjectUpdater) => {
    setWorkspace((current) => {
      const existing = current.projectDetails[paperId];
      if (!existing) return current;

      const updated = updater(existing);
      projectDetailsRef.current = {
        ...projectDetailsRef.current,
        [paperId]: updated,
      };
      const previousSummary = current.papers.find((paper) => paper.id === paperId);
      const summary = summarizePaper(updated, { isLocal: previousSummary?.isLocal });

      return {
        ...current,
        papers: current.papers.map((paper) => (paper.id === paperId ? summary : paper)),
        projectDetails: {
          ...current.projectDetails,
          [paperId]: updated,
        },
      };
    });
  }, [summarizePaper]);

  // Returns the id of the created paper so callers can navigate to it.
  const createPaper = useCallback((formData: FormData) => {
    const id = uid("paper");
    const paper = {
      id,
      title: getFormString(formData, "title"),
      theme: getFormString(formData, "theme"),
      researchLead: user?.name || "",
      framework: getFormString(formData, "framework"),
      geography: getFormString(formData, "geography"),
      updatedAt: "Just now",
      researchQuestion: getFormString(formData, "researchQuestion"),
      sources: defaultSources.map((source) => ({ ...source })),
      articles: [],
      collaborators: [],
      archived: false,
      isLocal: true,
    } satisfies Project;

    projectDetailsRef.current = {
      ...projectDetailsRef.current,
      [id]: paper,
    };
    setWorkspace((current) => ({
      ...current,
      papers: [summarizePaper(paper, { isLocal: true }), ...current.papers],
      projectDetails: {
        ...current.projectDetails,
        [id]: paper,
      },
    }));
    return id;
  }, [summarizePaper, user]);

  if (status === "loading") {
    return (
      <main className="workspace-status" aria-live="polite">
        <div className="loading-indicator" aria-hidden="true" />
        <p>Loading research projects...</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="workspace-status" role="alert">
        <h1>Unable to load the workspace</h1>
        <p>{error?.message || "The research API could not be reached."}</p>
        <button className="primary" type="button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="workspace-status" role="alert">
        <h1>Unable to load the workspace</h1>
        <p>The signed-in user could not be loaded.</p>
      </main>
    );
  }

  const value: WorkspaceContextValue = {
    papers,
    user,
    getPaper: (paperId?: string) => (paperId ? projectDetails[paperId] : undefined),
    fetchProject,
    createPaper,
    updatePaper,
    logout: onAuthExpired,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
