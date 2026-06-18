import { useState } from "react";
import { Archive, ArchiveRestore, ChevronDown, UserPlus, X } from "lucide-react";
import { collaboratorPool } from "../../data/constants";
import { getAllSearchTerms, getSelectedArticles, getUniqueCount } from "../../lib/pipeline";
import { useDismiss } from "../../hooks/useDismiss";
import Metric from "../Metric";
import type { Collaborator, Project } from "../../types";

interface SummaryPanelProps {
  paper: Project;
  onInviteCollaborator: (collaborator: Collaborator) => void;
  onRemoveCollaborator: (collaboratorId: string) => void;
  onToggleArchive: () => void;
}

export default function SummaryPanel({
  paper,
  onInviteCollaborator,
  onRemoveCollaborator,
  onToggleArchive,
}: SummaryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inviteeId, setInviteeId] = useState("");
  const ref = useDismiss<HTMLDivElement>(() => setIsOpen(false), isOpen);

  const selectedArticles = getSelectedArticles(paper);
  const included = selectedArticles.filter((article) => article.reviewDecision === "Included").length;
  const pulled = selectedArticles.filter((article) => article.fullTextStatus === "Pulled").length;
  const termCount = getAllSearchTerms(paper).length;
  const invitedIds = new Set(paper.collaborators.map((person) => person.id));
  const availableCollaborators = collaboratorPool.filter(
    (person) => person.name !== paper.researchLead && !invitedIds.has(person.id),
  );
  const selectedInvitee = availableCollaborators.find((person) => person.id === inviteeId);

  function inviteCollaborator() {
    if (!selectedInvitee) return;
    onInviteCollaborator(selectedInvitee);
    setInviteeId("");
  }

  return (
    <div className={`project-summary ${isOpen ? "open" : ""}`} ref={ref}>
      <button
        className="project-summary-toggle icon-button"
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close project summary" : "Open project summary"}
        title={isOpen ? "Close project summary" : "Open project summary"}
        onClick={() => setIsOpen((open) => !open)}
      >
        <ChevronDown size={20} className="project-summary-chevron" />
      </button>

      {isOpen && (
        <div className="project-summary-panel" role="region" aria-label="Project summary">
          <div className="summary-block">
            <span>Research question</span>
            <p>{paper.researchQuestion}</p>
          </div>
          <div className="metric-grid compact">
            <Metric label="Search terms" value={termCount} />
            <Metric label="Total records" value={paper.articles.length} />
            <Metric label="Unique records" value={getUniqueCount(paper.articles)} />
            <Metric label="Selected records" value={selectedArticles.length} />
            <Metric label="Pulled articles" value={pulled} />
            <Metric label="Included articles" value={included} />
          </div>
          <div className="collaborator-section">
            <div className="collaborator-section-head">
              <span>Collaborators</span>
              <strong>{paper.collaborators.length}</strong>
            </div>
            <div className="collaborator-list">
              {paper.collaborators.map((person) => (
                <div className="collaborator-row" key={person.id}>
                  <span className="mini-avatar">{person.initials}</span>
                  <span>
                    <strong>{person.name}</strong>
                  </span>
                  <button
                    className="remove-collaborator"
                    type="button"
                    aria-label={`Remove ${person.name}`}
                    onClick={() => onRemoveCollaborator(person.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {!paper.collaborators.length && <p className="collaborator-empty">No collaborators invited</p>}
            </div>
            <div className="invite-row">
              <select
                aria-label="Invite collaborator"
                value={inviteeId}
                onChange={(event) => setInviteeId(event.target.value)}
              >
                <option value="">Select person</option>
                {availableCollaborators.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              <button
                className="invite-button icon-button"
                type="button"
                disabled={!selectedInvitee}
                onClick={inviteCollaborator}
              >
                <UserPlus size={17} />
                Invite
              </button>
            </div>
          </div>
          <button
            className={`summary-action ${paper.archived ? "restore" : "archive"}`}
            type="button"
            onClick={() => {
              onToggleArchive();
              setIsOpen(false);
            }}
          >
            {paper.archived ? <ArchiveRestore size={17} /> : <Archive size={17} />}
            {paper.archived ? "Restore project" : "Archive project"}
          </button>
        </div>
      )}
    </div>
  );
}
