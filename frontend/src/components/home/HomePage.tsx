import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { projectStatus } from "../../data/constants";
import AppHeader from "../AppHeader";
import NewProjectModal from "../NewProjectModal";
import EmptyState from "../EmptyState";
import ProjectRow from "./ProjectRow";
import type { ProjectFilter } from "../../types";

export default function HomePage() {
  const { papers, user, createPaper, logout } = useWorkspace();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: papers.filter((paper) => !paper.archived).length,
      progress: papers.filter((paper) => !paper.archived && paper.status === projectStatus.IN_PROGRESS).length,
      complete: papers.filter((paper) => !paper.archived && paper.status === projectStatus.COMPLETE).length,
      archived: papers.filter((paper) => paper.archived).length,
    }),
    [papers],
  );

  const filteredPapers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return papers.filter((paper) => {
      const searchable = [
        paper.title,
        paper.theme,
        paper.geography,
        paper.framework,
        paper.researchLead,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (filter === "all" ||
          (filter === "progress" && paper.status === projectStatus.IN_PROGRESS) ||
          (filter === "complete" && paper.status === projectStatus.COMPLETE) ||
          (filter === "archived" && paper.archived)) &&
        (filter === "archived" || !paper.archived) &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [filter, papers, query]);

  const tabs: Array<[ProjectFilter, string, number]> = [
    ["all", "All", counts.all],
    ["progress", "In progress", counts.progress],
    ["complete", "Complete", counts.complete],
    ["archived", "Archived", counts.archived],
  ];

  function handleCreate(formData: FormData) {
    const id = createPaper(formData);
    setIsModalOpen(false);
    navigate(`/projects/${id}`);
  }

  return (
    <main className="home-shell">
      <AppHeader user={user} onLogout={logout} />

      <section className="home-heading">
        <div>
          <p className="eyebrow">{user.department}</p>
          <h1>Research projects</h1>
        </div>
        <button className="primary new-project-button" type="button" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          New project
        </button>
      </section>

      <section className="home-controls">
        <div className="project-tabs" aria-label="Project filters">
          {tabs.map(([id, label, count]) => (
            <button className={filter === id ? "active" : ""} key={id} type="button" onClick={() => setFilter(id)}>
              {label} <span>{count}</span>
            </button>
          ))}
        </div>
        <label className="project-search">
          <Search size={22} />
          <input
            aria-label="Search projects"
            placeholder="Search projects..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </section>

      <section className="project-list-panel">
        {filteredPapers.map((paper) => (
          <ProjectRow key={paper.id} paper={paper} />
        ))}
        {!filteredPapers.length && <EmptyState label="No projects found" />}
      </section>

      {isModalOpen && <NewProjectModal onClose={() => setIsModalOpen(false)} onCreate={handleCreate} />}
    </main>
  );
}
