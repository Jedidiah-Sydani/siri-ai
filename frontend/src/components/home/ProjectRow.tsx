import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { projectStatus } from "../../data/constants";
import type { ProjectSummary } from "../../types";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

export default function ProjectRow({ paper }: { paper: ProjectSummary }) {
  const navigate = useNavigate();
  const stage = {
    label: paper.stageLabel,
    number: paper.stageNumber,
    progress: paper.progress,
  };
  const status = paper.status;
  const accessPeople = [
    { id: "research-lead", name: paper.researchLead, initials: getInitials(paper.researchLead) },
    ...paper.collaborators,
  ];
  const visiblePeople = accessPeople.slice(0, 4);
  const overflowCount = accessPeople.length - visiblePeople.length;

  const statusClass = [
    "project-status",
    status === projectStatus.IDEA ? "idea" : "",
    status === projectStatus.COMPLETE ? "complete" : "",
    status === projectStatus.ARCHIVED ? "archived" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className="project-row" type="button" onClick={() => navigate(`/projects/${paper.id}`)}>
      <span className="access-cloud" aria-label={`${accessPeople.length} people have access`}>
        {visiblePeople.map((person) => (
          <span className="access-initial" key={person.id} title={person.name}>
            {person.initials}
          </span>
        ))}
        {overflowCount > 0 && <span className="access-initial overflow">+{overflowCount}</span>}
      </span>
      <span className="project-row-main">
        <span className={statusClass}>{status}</span>
        <strong>{paper.title}</strong>
        <span className="project-row-meta">
          {paper.theme} · {paper.framework} · {paper.geography} · {paper.researchLead}
        </span>
      </span>
      <span className="project-row-progress">
        <strong>
          Stage {stage.number} · {stage.label}
        </strong>
        <span className="progress-track">
          <span style={{ width: `${stage.progress}%` }} />
        </span>
      </span>
      <span className="project-updated">
        <small>Updated</small>
        <strong>{paper.updatedAt || "Just now"}</strong>
      </span>
      <ChevronRight className="row-chevron" size={26} />
    </button>
  );
}
