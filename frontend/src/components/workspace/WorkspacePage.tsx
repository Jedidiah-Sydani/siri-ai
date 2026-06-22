import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { resolveActiveStage } from "../../lib/pipeline";
import AppHeader from "../AppHeader";
import StageRail from "./StageRail";
import StageContent from "./StageContent";
import SummaryPanel from "./SummaryPanel";
import type { Collaborator, ProjectUpdater, RequestStatus, StageId } from "../../types";

interface ProjectRequestState {
  paperId?: string;
  status: Exclude<RequestStatus, "idle">;
  error: Error | null;
}

export default function WorkspacePage() {
  const { paperId, stageId } = useParams();
  const { fetchProject, getPaper, logout, updatePaper, user } = useWorkspace();
  const navigate = useNavigate();
  const [requestState, setRequestState] = useState<ProjectRequestState>({
    paperId: undefined,
    status: "loading",
    error: null,
  });

  const paper = getPaper(paperId);
  const currentRequestState =
    requestState.paperId === paperId
      ? requestState
      : { paperId, status: "loading", error: null };

  useEffect(() => {
    if (!paperId) {
      return undefined;
    }

    const controller = new AbortController();

    fetchProject(paperId, controller.signal)
      .then(() => setRequestState({ paperId, status: "ready", error: null }))
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        const error = loadError instanceof Error ? loadError : new Error("The project could not be found.");
        setRequestState({ paperId, status: "error", error });
      });

    return () => controller.abort();
  }, [fetchProject, paperId]);

  const onUpdatePaper = useCallback(
    (updater: ProjectUpdater) => {
      if (paperId) updatePaper(paperId, updater);
    },
    [updatePaper, paperId],
  );

  const onToggleArchive = useCallback(() => {
    onUpdatePaper((current) => ({
      ...current,
      archived: !current.archived,
      updatedAt: "Just now",
    }));
  }, [onUpdatePaper]);

  const onInviteCollaborator = useCallback((collaborator: Collaborator) => {
    onUpdatePaper((current) => {
      if (current.collaborators.some((person) => person.id === collaborator.id)) return current;
      return {
        ...current,
        collaborators: [...current.collaborators, collaborator],
        updatedAt: "Just now",
      };
    });
  }, [onUpdatePaper]);

  const onRemoveCollaborator = useCallback((collaboratorId: string) => {
    onUpdatePaper((current) => ({
      ...current,
      collaborators: current.collaborators.filter((person) => person.id !== collaboratorId),
      updatedAt: "Just now",
    }));
  }, [onUpdatePaper]);

  if (currentRequestState.status === "loading") {
    return (
      <div className="project-shell">
        <AppHeader user={user} className="project-workspace-topbar" onLogout={logout} />
        <main className="workspace-status" aria-live="polite">
          <div className="loading-indicator" aria-hidden="true" />
          <p>Loading project...</p>
        </main>
      </div>
    );
  }

  if (currentRequestState.status === "error" || !paper) {
    return (
      <div className="project-shell">
        <AppHeader user={user} className="project-workspace-topbar" onLogout={logout} />
        <main className="workspace-status" role="alert">
          <h1>Unable to load this project</h1>
          <p>{currentRequestState.error?.message || "The project could not be found."}</p>
          <button className="primary" type="button" onClick={() => navigate("/")}>
            Back to projects
          </button>
        </main>
      </div>
    );
  }

  if (!paperId) {
    return null;
  }

  const activeStage = resolveActiveStage(stageId, paper);

  function selectStage(nextStageId: StageId) {
    navigate(`/projects/${paperId}/${nextStageId}`);
  }

  return (
    <div className="project-shell">
      <AppHeader user={user} className="project-workspace-topbar" onLogout={logout} />

      <main className="project-main">
        <section className="project-hero">
          <button className="back-button icon-button" type="button" onClick={() => navigate("/")}>
            <ArrowLeft size={17} />
            Projects
          </button>
          <div className="project-heading">
            <h1>{paper.title}</h1>
            <SummaryPanel
              paper={paper}
              onInviteCollaborator={onInviteCollaborator}
              onRemoveCollaborator={onRemoveCollaborator}
              onToggleArchive={onToggleArchive}
            />
          </div>
        </section>

        <section className="pipeline-shell">
          <StageRail activeStage={activeStage} paper={paper} onSelectStage={selectStage} />
          <section className="stage-panel">
            <StageContent activeStage={activeStage} paper={paper} onUpdatePaper={onUpdatePaper} />
          </section>
        </section>
      </main>
    </div>
  );
}
