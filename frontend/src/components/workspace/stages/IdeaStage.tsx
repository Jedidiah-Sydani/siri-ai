import { CheckCircle2 } from "lucide-react";
import { researchFrameworks } from "../../../data/constants";
import type { StageProps } from "../../../types";

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export default function IdeaStage({ paper, onUpdatePaper }: StageProps) {
  function saveIdea(formData: FormData) {
    onUpdatePaper((current) => ({
      ...current,
      title: getFormString(formData, "title"),
      theme: getFormString(formData, "theme"),
      geography: getFormString(formData, "geography"),
      framework: getFormString(formData, "framework"),
      researchQuestion: getFormString(formData, "researchQuestion"),
      updatedAt: "Just now",
    }));
  }

  return (
    <form action={saveIdea} className="stage-form">
      <div className="form-grid">
        <label>
          Research Lead
          <input value={paper.researchLead} disabled readOnly />
        </label>
        <div className="stage-actions stage-actions-end idea-save-cell">
          <button className="primary icon-button" type="submit">
            <CheckCircle2 size={17} />
            Save
          </button>
        </div>
        <label className="span-2">
          Research question
          <textarea name="researchQuestion" defaultValue={paper.researchQuestion} required />
        </label>
        <label>
          Working title
          <input name="title" defaultValue={paper.title} required />
        </label>
        <label>
          Theme
          <input name="theme" defaultValue={paper.theme} required />
        </label>
        <label>
          Geography
          <input name="geography" defaultValue={paper.geography} />
        </label>
        <label>
          Framework
          <select name="framework" defaultValue={paper.framework} required>
            {researchFrameworks.map((framework) => (
              <option key={framework} value={framework}>
                {framework}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
