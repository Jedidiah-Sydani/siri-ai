import { Download, Languages } from "lucide-react";
import type { TranscriptJob } from "../../types";
import { downloadText } from "./audioActions";
import type { ProcessingAction } from "./transcriptionTypes";

interface TranscriptionResultPanelProps {
  job: TranscriptJob;
  translateTo: string;
  processingAction: ProcessingAction;
  onTranslateToChange: (language: string) => void;
  onTranslate: () => void;
}

export default function TranscriptionResultPanel({
  job,
  translateTo,
  processingAction,
  onTranslateToChange,
  onTranslate,
}: TranscriptionResultPanelProps) {
  return (
    <div className="transcription-main-grid">
      <section className="transcription-card transcription-editor">
        <div className="section-head">
          <div>
            <h2>Transcription result</h2>
            <p>{job.updatedAt}</p>
          </div>
          <div className="result-tools">
            <div className="detected-language">
              <span>Detected language</span>
              <strong>{job.detectedLanguage}</strong>
            </div>
            <div className="translation-controls">
              <label>
                Translate to
                <select value={translateTo} onChange={(event) => onTranslateToChange(event.target.value)}>
                  <option value="english">English</option>
                  <option value="hausa">Hausa</option>
                  <option value="yoruba">Yoruba</option>
                  <option value="igbo">Igbo</option>
                  <option value="french">French</option>
                </select>
              </label>
              <button
                className="secondary-action icon-button"
                type="button"
                disabled={processingAction !== "idle"}
                onClick={onTranslate}
              >
                {processingAction === "translating" ? (
                  <span className="button-spinner" aria-hidden="true" />
                ) : (
                  <Languages size={15} />
                )}
                {processingAction === "translating" ? "Translating..." : "Translate"}
              </button>
            </div>
          </div>
        </div>

        <div className="transcript-columns">
          <div className="text-area-panel">
            <div className="text-area-head">
              <h3>Transcript</h3>
              <button
                className="icon-only"
                type="button"
                aria-label="Download transcript"
                disabled={!job.transcript}
                onClick={() => downloadText(job.transcript, `${job.title}-transcript.txt`)}
              >
                <Download size={16} />
              </button>
            </div>
            <textarea className="transcript-textarea" value={job.transcript} readOnly />
          </div>
          <div className="translation-panel">
            <div className="text-area-panel">
              <div className="text-area-head">
                <h3>Translation</h3>
                <button
                  className="icon-only"
                  type="button"
                  aria-label="Download translation"
                  disabled={!job.translation}
                  onClick={() => downloadText(job.translation, `${job.title}-translation.txt`)}
                >
                  <Download size={16} />
                </button>
              </div>
              <textarea className="transcript-textarea" value={job.translation} readOnly />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
