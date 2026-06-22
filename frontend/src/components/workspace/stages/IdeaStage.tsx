import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { getFrameworkDefinition, isFrameworkId, researchFrameworks } from "../../../data/constants";
import type { FrameworkFields, FrameworkId, StageProps } from "../../../types";

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export default function IdeaStage({ paper, onUpdatePaper }: StageProps) {
  const [selectedFramework, setSelectedFramework] = useState<FrameworkId>(paper.framework);
  const [frameworkFields, setFrameworkFields] = useState<FrameworkFields>(paper.frameworkFields);
  const frameworkDefinition = getFrameworkDefinition(selectedFramework);

  useEffect(() => {
    setSelectedFramework(paper.framework);
    setFrameworkFields(paper.frameworkFields);
  }, [paper.id, paper.framework, paper.frameworkFields]);

  function updateFrameworkField(fieldId: keyof FrameworkFields, value: string) {
    setFrameworkFields((current) => ({
      ...current,
      [fieldId]: value,
    }));
  }

  function cleanFrameworkFields(fields: FrameworkFields): FrameworkFields {
    return Object.fromEntries(
      Object.entries(fields)
        .filter(([, value]) => typeof value === "string" && value.trim())
        .map(([key, value]) => [key, value.trim()]),
    ) as FrameworkFields;
  }

  function saveIdea(formData: FormData) {
    const framework = getFormString(formData, "framework");
    onUpdatePaper((current) => ({
      ...current,
      title: getFormString(formData, "title"),
      theme: getFormString(formData, "theme"),
      geography: getFormString(formData, "geography"),
      framework: isFrameworkId(framework) ? framework : "PICO",
      frameworkFields: cleanFrameworkFields(frameworkFields),
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
      </div>
      <label className="framework-select-row">
        Framework
        <select
          name="framework"
          value={selectedFramework}
          onChange={(event) => setSelectedFramework(event.target.value as FrameworkId)}
          required
        >
          {researchFrameworks.map((framework) => (
            <option key={framework.id} value={framework.id}>
              {framework.label}
            </option>
          ))}
        </select>
      </label>
      <div className="framework-fieldset">
        {frameworkDefinition.fields.map((field) => (
          <label key={field.id}>
            {field.label}
            <input
              value={frameworkFields[field.id] || ""}
              onChange={(event) => updateFrameworkField(field.id, event.target.value)}
              placeholder={field.help}
            />
          </label>
        ))}
      </div>
    </form>
  );
}
