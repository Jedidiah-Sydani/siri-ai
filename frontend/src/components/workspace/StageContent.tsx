import IdeaStage from "./stages/IdeaStage";
import SearchStage from "./stages/SearchStage";
import DedupeStage from "./stages/DedupeStage";
import RetrievalStage from "./stages/RetrievalStage";
import ReviewStage from "./stages/ReviewStage";
import type { ReactElement } from "react";
import type { StageId, StageProps } from "../../types";

const STAGE_COMPONENTS: Record<StageId, (props: StageProps) => ReactElement> = {
  idea: IdeaStage,
  search: SearchStage,
  dedupe: DedupeStage,
  retrieval: RetrievalStage,
  review: ReviewStage,
};

export default function StageContent({ activeStage, paper, onUpdatePaper }: StageProps & { activeStage: StageId }) {
  const Stage = STAGE_COMPONENTS[activeStage] || ReviewStage;
  return <Stage paper={paper} onUpdatePaper={onUpdatePaper} />;
}
