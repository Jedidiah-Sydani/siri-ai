import { Download, FileAudio, Play, Upload } from "lucide-react";
import type { TranscriptJob } from "../../types";

interface RecordingOverviewProps {
  job: TranscriptJob;
  onPlayOriginal: () => void;
  onDownloadOriginal: () => void;
  onReplaceAudio: () => void;
}

export default function RecordingOverview({
  job,
  onPlayOriginal,
  onDownloadOriginal,
  onReplaceAudio,
}: RecordingOverviewProps) {
  return (
    <div className="transcription-card transcription-overview">
      <div className="transcription-title-block">
        <span className="recording-icon large">
          <FileAudio size={22} />
        </span>
        <div>
          <h2>{job.title}</h2>
          <p>
            {job.fileName} · {job.duration}
          </p>
        </div>
      </div>
      <div className="recording-title-actions" aria-label="Original audio actions">
        <button
          className="icon-only"
          type="button"
          aria-label="Play original audio"
          disabled={!job.hasOriginalAudio}
          onClick={onPlayOriginal}
        >
          <Play size={16} fill="currentColor" />
        </button>
        <button
          className="icon-only"
          type="button"
          aria-label="Download original audio"
          disabled={!job.hasOriginalAudio}
          onClick={onDownloadOriginal}
        >
          <Download size={16} />
        </button>
        <button className="icon-button" type="button" onClick={onReplaceAudio}>
          <Upload size={15} />
          Replace audio
        </button>
      </div>
    </div>
  );
}
