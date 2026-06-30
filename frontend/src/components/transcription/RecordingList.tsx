import { ChevronRight, Play, Search } from "lucide-react";
import type { TranscriptJob } from "../../types";

interface RecordingListProps {
  activeJobId: string;
  jobs: TranscriptJob[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelectJob: (jobId: string) => void;
  onPlayJob: (jobId: string) => void;
}

export default function RecordingList({
  activeJobId,
  jobs,
  query,
  onQueryChange,
  onSelectJob,
  onPlayJob,
}: RecordingListProps) {
  return (
    <aside className="recording-panel">
      <div className="recording-panel-head">
        <h2>Recordings</h2>
        <label className="recording-search">
          <Search size={17} />
          <input
            aria-label="Search recordings"
            placeholder="Search recordings..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
      </div>

      <div className="recording-list">
        {jobs.map((job) => (
          <div
            className={job.id === activeJobId ? "recording-row active" : "recording-row"}
            key={job.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectJob(job.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelectJob(job.id);
            }}
          >
            <button
              className="recording-play-button"
              type="button"
              aria-label={`Play ${job.title}`}
              disabled={!job.hasOriginalAudio}
              onClick={(event) => {
                event.stopPropagation();
                onPlayJob(job.id);
              }}
            >
              <Play size={17} />
            </button>
            <span className="recording-copy">
              <strong>{job.title}</strong>
              <small className="recording-file-meta">
                <span>{job.fileName}</span>
                <span>·</span>
                <span>{job.duration}</span>
              </small>
            </span>
            <ChevronRight size={17} />
          </div>
        ))}
        {!jobs.length && <p className="recording-empty">No recordings found</p>}
      </div>
    </aside>
  );
}
