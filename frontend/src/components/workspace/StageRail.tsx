import { Check } from "lucide-react";
import { stages } from "../../data/constants";
import { isStageComplete } from "../../lib/pipeline";
import type { Project, StageId } from "../../types";

interface StageRailProps {
  activeStage: StageId;
  paper: Project;
  onSelectStage: (stageId: StageId) => void;
}

export default function StageRail({ activeStage, paper, onSelectStage }: StageRailProps) {
  return (
    <nav className="stage-rail" aria-label="Research stages">
      {stages.map((stage) => {
        const Icon = stage.icon;
        const isActive = stage.id === activeStage;
        const isComplete = isStageComplete(paper, stage.id);

        return (
          <button
            className={`stage-step ${isActive ? "active" : ""} ${isComplete ? "complete" : ""}`}
            key={stage.id}
            type="button"
            aria-current={isActive ? "step" : undefined}
            onClick={() => onSelectStage(stage.id)}
          >
            <span className="stage-icon">{isComplete ? <Check size={17} /> : <Icon size={17} />}</span>
            <span>
              <strong>{stage.label}</strong>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
