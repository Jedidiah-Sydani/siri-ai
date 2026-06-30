import { fetchTranscriptionAudio } from "../../services/transcriptionApi";

async function getAudioObjectUrl(jobId: string, kind: "original" | "cleaned") {
  const blob = await fetchTranscriptionAudio(jobId, kind);
  return URL.createObjectURL(blob);
}

export async function playStoredAudio(jobId: string, kind: "original" | "cleaned") {
  const url = await getAudioObjectUrl(jobId, kind);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.onerror = () => URL.revokeObjectURL(url);
  await audio.play();
}

export async function downloadStoredAudio(jobId: string, kind: "original" | "cleaned", fileName: string) {
  const url = await getAudioObjectUrl(jobId, kind);
  const link = document.createElement("a");
  link.href = url;
  link.download = kind === "cleaned" ? `cleaned-${fileName}` : fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadText(text: string, fileName: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}
