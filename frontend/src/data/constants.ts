import {
  ClipboardList,
  CopyCheck,
  Download,
  ListChecks,
  Search,
} from "lucide-react";
import type { ProjectStatus, ResearchSource, StageDefinition, StageId } from "../types";
import type { Collaborator } from "../types";

// Ordered pipeline. `id` is the internal/route identifier; `label` is what users see.
export const stages: StageDefinition[] = [
  { id: "idea", label: "Ideation", icon: ClipboardList },
  { id: "search", label: "Search", icon: Search },
  { id: "dedupe", label: "Selection", icon: CopyCheck },
  { id: "retrieval", label: "Retrieval", icon: Download },
  { id: "review", label: "Review", icon: ListChecks },
];

// Labels used on the project list / hero, where "idea" reads better as a noun phrase.
export const stageHomeLabels: Record<StageId, string> = {
  idea: "Ideation",
  search: "Search",
  dedupe: "Selection",
  retrieval: "Retrieval",
  review: "Review",
};

export const defaultSources: ResearchSource[] = [
  { id: "pubmed", name: "PubMed", enabled: true, resultCount: 0, lastRun: "", searchTerm: "" },
  { id: "scholar", name: "Google Scholar", enabled: true, resultCount: 0, lastRun: "", searchTerm: "" },
  { id: "scopus", name: "Scopus", enabled: false, resultCount: 0, lastRun: "", searchTerm: "" },
  { id: "openalex", name: "OpenAlex", enabled: true, resultCount: 0, lastRun: "", searchTerm: "" },
];

export const projectStatus = {
  IDEA: "Ideation",
  IN_PROGRESS: "In progress",
  COMPLETE: "Complete",
  ARCHIVED: "Archived",
} as const satisfies Record<string, ProjectStatus>;

export const researchFrameworks = [
  "PICO",
  "PEO",
  "PICOT",
  "SPIDER",
  "Scoping review",
] as const;

export const collaboratorPool: Collaborator[] = [
  { id: "joy-aifuobhokhan", name: "Dr. Joy Aifuobhokhan", initials: "JA" },
  { id: "tunde-bakare", name: "Dr. Tunde Bakare", initials: "TB" },
  { id: "amara-okeke", name: "Dr. Amara Okeke", initials: "AO" },
  { id: "ngozi-eze", name: "Ngozi Eze", initials: "NE" },
  { id: "fatima-bello", name: "Fatima Bello", initials: "FB" },
  { id: "musa-ibrahim", name: "Musa Ibrahim", initials: "MI" },
  { id: "adaora-nwosu", name: "Adaora Nwosu", initials: "AN" },
  { id: "chinedu-okafor", name: "Chinedu Okafor", initials: "CO" },
  { id: "zainab-yusuf", name: "Zainab Yusuf", initials: "ZY" },
  { id: "emeka-obi", name: "Emeka Obi", initials: "EO" },
];
