import { useState } from "react";
import { Plus } from "lucide-react";
import { getFrameworkDefinition, researchFrameworks } from "../data/constants";
import Modal from "./Modal";
import type { FrameworkFields, FrameworkId } from "../types";

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (formData: FormData) => void;
}

export default function NewProjectModal({ onClose, onCreate }: NewProjectModalProps) {
  const [selectedFramework, setSelectedFramework] = useState<FrameworkId>("PICO");
  const [frameworkFields, setFrameworkFields] = useState<FrameworkFields>({});
  const frameworkDefinition = getFrameworkDefinition(selectedFramework);

  function updateFrameworkField(fieldId: keyof FrameworkFields, value: string) {
    setFrameworkFields((current) => ({
      ...current,
      [fieldId]: value,
    }));
  }

  return (
    <Modal title="New project" titleId="newProjectTitle" onClose={onClose}>
      <form action={onCreate} className="modal-body">
        <input type="hidden" name="frameworkFieldsJson" value={JSON.stringify(frameworkFields)} />
        <div className="form-grid">
          <label>
            Working title
            <input name="title" required />
          </label>
          <label>
            Theme
            <input name="theme" required />
          </label>
          <label>
            Research question
            <textarea name="researchQuestion" required />
          </label>
          <label>
            Geography
            <input name="geography" />
          </label>
          <label>
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
          <div className="framework-fieldset span-2">
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
        </div>
        <div className="stage-actions">
          <button className="primary icon-button" type="submit">
            <Plus size={17} />
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}
