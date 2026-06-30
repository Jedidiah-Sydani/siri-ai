import type { TranscriptJob } from "../types";
import { ApiError, getStoredAuthToken } from "./workspaceApi";

function authHeaders(extraHeaders: Record<string, string> = {}) {
  const token = getStoredAuthToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

async function createApiError(response: Response, fallbackMessage: string) {
  let payload: { detail?: string } = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  return new ApiError(payload.detail || fallbackMessage, response.status);
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...authHeaders(),
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw await createApiError(response, `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function listTranscriptions(signal?: AbortSignal) {
  return requestJson<TranscriptJob[]>("/api/transcriptions", { signal });
}

export async function uploadTranscription(file: File, title: string) {
  const body = new FormData();
  body.append("file", file);
  if (title.trim()) body.append("title", title.trim());

  return requestJson<TranscriptJob>("/api/transcriptions", {
    method: "POST",
    body,
  });
}

export async function replaceTranscriptionAudio(jobId: string, file: File) {
  const body = new FormData();
  body.append("file", file);

  return requestJson<TranscriptJob>(`/api/transcriptions/${jobId}/audio`, {
    method: "POST",
    body,
  });
}

export function cleanTranscriptionAudio(jobId: string) {
  return requestJson<TranscriptJob>(`/api/transcriptions/${jobId}/clean`, { method: "POST" });
}

export function transcribeAudio(jobId: string, language: string) {
  return requestJson<TranscriptJob>(`/api/transcriptions/${jobId}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language }),
  });
}

export function translateTranscript(jobId: string, sourceLanguage: string, targetLanguage: string) {
  return requestJson<TranscriptJob>(`/api/transcriptions/${jobId}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceLanguage, targetLanguage }),
  });
}

export async function fetchTranscriptionAudio(jobId: string, kind: "original" | "cleaned") {
  const response = await fetch(`/api/transcriptions/${jobId}/audio/${kind}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw await createApiError(response, `Audio request failed with status ${response.status}`);
  }

  return response.blob();
}
