import { Download, Play, SlidersHorizontal, Sparkles } from "lucide-react";
import type { TranscriptJob } from "../../types";
import type { ProcessingAction } from "./transcriptionTypes";

interface AudioProcessingPanelProps {
  job: TranscriptJob;
  language: string;
  processingAction: ProcessingAction;
  waveformBars: number[];
  onLanguageChange: (language: string) => void;
  onCleanAudio: () => void;
  onPlayCleaned: () => void;
  onDownloadCleaned: () => void;
  onTranscribeAudio: () => void;
}

export default function AudioProcessingPanel({
  job,
  language,
  processingAction,
  waveformBars,
  onLanguageChange,
  onCleanAudio,
  onPlayCleaned,
  onDownloadCleaned,
  onTranscribeAudio,
}: AudioProcessingPanelProps) {
  return (
    <div className="transcription-card processing-card">
      <div className="section-head compact">
        <h2>Audio processing</h2>
        <button
          className="secondary-action icon-button"
          type="button"
          disabled={!job.hasOriginalAudio || processingAction !== "idle"}
          onClick={onCleanAudio}
        >
          {processingAction === "cleaning" ? (
            <span className="button-spinner" aria-hidden="true" />
          ) : (
            <SlidersHorizontal size={15} />
          )}
          {processingAction === "cleaning" ? "Cleaning..." : "Clean audio"}
        </button>
      </div>
      <div className="processing-audio-row">
        <div className="audio-strip compact">
          <div className="audio-wave" aria-hidden="true">
            {waveformBars.map((height, index) => (
              <span key={`${job.id}-${index}`} style={{ height: `${height}px` }} />
            ))}
          </div>
          <button
            className="play-button"
            type="button"
            aria-label="Play cleaned recording"
            disabled={!job.hasCleanedAudio}
            onClick={onPlayCleaned}
          >
            <Play size={15} fill="currentColor" />
          </button>
        </div>
        <button
          className="icon-only"
          type="button"
          aria-label="Download cleaned audio"
          disabled={!job.hasCleanedAudio}
          onClick={onDownloadCleaned}
        >
          <Download size={16} />
        </button>
      </div>
      <div className="transcription-action-row">
        <label>
          Language
          <select value={language} onChange={(event) => onLanguageChange(event.target.value)}>
            <option value="auto">Auto detect</option>
            <option value="english">English</option>
            <option value="hausa">Hausa</option>
            <option value="yoruba">Yoruba</option>
            <option value="igbo">Igbo</option>
          </select>
        </label>
        <button
          className="primary icon-button"
          type="button"
          disabled={!job.hasOriginalAudio || processingAction !== "idle"}
          onClick={onTranscribeAudio}
        >
          {processingAction === "transcribing" ? (
            <span className="button-spinner" aria-hidden="true" />
          ) : (
            <Sparkles size={15} />
          )}
          {processingAction === "transcribing" ? "Transcribing..." : "Transcribe audio"}
        </button>
      </div>
    </div>
  );
}
