import { Plus } from "lucide-react";
import { researchFrameworks } from "../data/constants";
import Modal from "./Modal";

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (formData: FormData) => void;
}

export default function NewProjectModal({ onClose, onCreate }: NewProjectModalProps) {
  return (
    <Modal title="New project" titleId="newProjectTitle" onClose={onClose}>
      <form action={onCreate} className="modal-body">
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
            <select name="framework" defaultValue={researchFrameworks[0]} required>
              {researchFrameworks.map((framework) => (
                <option key={framework} value={framework}>
                  {framework}
                </option>
              ))}
            </select>
          </label>
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
