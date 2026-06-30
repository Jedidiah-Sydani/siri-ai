import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import AppHeader from "../AppHeader";
import { useWorkspace } from "../../context/WorkspaceContext";
import {
  cleanTranscriptionAudio,
  listTranscriptions,
  replaceTranscriptionAudio,
  transcribeAudio,
  translateTranscript,
  uploadTranscription,
} from "../../services/transcriptionApi";
import type { TranscriptJob } from "../../types";
import AudioProcessingPanel from "./AudioProcessingPanel";
import RecordingList from "./RecordingList";
import RecordingOverview from "./RecordingOverview";
import TranscriptionResultPanel from "./TranscriptionResultPanel";
import { downloadStoredAudio, playStoredAudio } from "./audioActions";
import type { ProcessingAction } from "./transcriptionTypes";
import { getStaticWaveformBars } from "./waveform";

export default function TranscriptionPage() {
  const { user, logout } = useWorkspace();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [jobs, setJobs] = useState<TranscriptJob[]>([]);
  const [activeJobId, setActiveJobId] = useState("");
  const [recordingQuery, setRecordingQuery] = useState("");
  const [language, setLanguage] = useState("auto");
  const [translateTo, setTranslateTo] = useState("english");
  const [processingAction, setProcessingAction] = useState<ProcessingAction>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setProcessingAction("loading");
    listTranscriptions(controller.signal)
      .then((recordings) => {
        setJobs(recordings);
        setActiveJobId((currentId) => currentId || recordings[0]?.id || "");
        setError(null);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setProcessingAction("idle"));

    return () => controller.abort();
  }, []);

  const activeJob = useMemo(
    () => jobs.find((job) => job.id === activeJobId) ?? jobs[0],
    [activeJobId, jobs],
  );

  const filteredJobs = useMemo(() => {
    const query = recordingQuery.trim().toLowerCase();
    if (!query) return jobs;
    return jobs.filter((job) => `${job.title} ${job.fileName}`.toLowerCase().includes(query));
  }, [jobs, recordingQuery]);

  const waveformBars = useMemo(() => {
    if (!activeJob) return [];
    return getStaticWaveformBars(activeJob.title.length + activeJob.fileName.length);
  }, [activeJob]);

  function mergeJob(updatedJob: TranscriptJob) {
    setJobs((currentJobs) => currentJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
  }

  async function runJobAction(action: Exclude<ProcessingAction, "idle" | "loading">, callback: () => Promise<TranscriptJob>) {
    setProcessingAction(action);
    try {
      const updatedJob = await callback();
      mergeJob(updatedJob);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setProcessingAction("idle");
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const fallbackTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
    const title = window.prompt("Recording title", fallbackTitle) || fallbackTitle;
    setProcessingAction("loading");
    try {
      const nextJob = await uploadTranscription(file, title);
      setJobs((currentJobs) => [nextJob, ...currentJobs]);
      setActiveJobId(nextJob.id);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Upload failed");
    } finally {
      setProcessingAction("idle");
    }
  }

  async function handleReplace(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeJob) return;

    setProcessingAction("loading");
    try {
      const updatedJob = await replaceTranscriptionAudio(activeJob.id, file);
      mergeJob(updatedJob);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Upload failed");
    } finally {
      setProcessingAction("idle");
    }
  }

  return (
    <main className="transcription-shell">
      <AppHeader user={user} onLogout={logout} />

      <section className="transcription-heading">
        <div>
          <p className="eyebrow">SIRI transcription and translation</p>
          <h1>Audio workspace</h1>
        </div>
        <input ref={uploadInputRef} type="file" accept="audio/*" hidden onChange={(event) => void handleUpload(event)} />
        <button
          className="primary transcription-upload-button"
          type="button"
          disabled={processingAction !== "idle"}
          onClick={() => uploadInputRef.current?.click()}
        >
          {processingAction === "loading" ? <span className="button-spinner" aria-hidden="true" /> : <Upload size={17} />}
          {processingAction === "loading" ? "Uploading..." : "Upload recording"}
        </button>
      </section>

      {error ? <p className="transcription-error">{error}</p> : null}

      <section className="transcription-layout">
        <RecordingList
          activeJobId={activeJob?.id ?? ""}
          jobs={filteredJobs}
          query={recordingQuery}
          onQueryChange={setRecordingQuery}
          onSelectJob={setActiveJobId}
          onPlayJob={(jobId) => {
            void playStoredAudio(jobId, "original");
          }}
        />

        {activeJob ? (
          <section className="transcription-workspace">
            <input ref={replaceInputRef} type="file" accept="audio/*" hidden onChange={(event) => void handleReplace(event)} />
            <RecordingOverview
              job={activeJob}
              onPlayOriginal={() => void playStoredAudio(activeJob.id, "original")}
              onDownloadOriginal={() => void downloadStoredAudio(activeJob.id, "original", activeJob.fileName)}
              onReplaceAudio={() => replaceInputRef.current?.click()}
            />
            <AudioProcessingPanel
              job={activeJob}
              language={language}
              processingAction={processingAction}
              waveformBars={waveformBars}
              onLanguageChange={setLanguage}
              onCleanAudio={() => void runJobAction("cleaning", () => cleanTranscriptionAudio(activeJob.id))}
              onPlayCleaned={() => void playStoredAudio(activeJob.id, "cleaned")}
              onDownloadCleaned={() => void downloadStoredAudio(activeJob.id, "cleaned", activeJob.fileName)}
              onTranscribeAudio={() => void runJobAction("transcribing", () => transcribeAudio(activeJob.id, language))}
            />
            <TranscriptionResultPanel
              job={activeJob}
              translateTo={translateTo}
              processingAction={processingAction}
              onTranslateToChange={setTranslateTo}
              onTranslate={() =>
                void runJobAction("translating", () => translateTranscript(activeJob.id, activeJob.detectedLanguage, translateTo))
              }
            />
          </section>
        ) : (
          <section className="transcription-card transcription-empty-state">
            {processingAction === "loading" ? "Loading recordings..." : "Upload a recording to begin."}
          </section>
        )}
      </section>
    </main>
  );
}
