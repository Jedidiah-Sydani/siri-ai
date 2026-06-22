import {
  ClipboardList,
  CopyCheck,
  Download,
  ListChecks,
  Search,
} from "lucide-react";
import type { FrameworkId, ProjectStatus, ResearchSource, StageDefinition, StageId } from "../types";
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
  {
    id: "PCC",
    label: "PCC — Scoping Reviews (JBI)",
    fields: [
      { id: "population", label: "Population", help: "Who are the people of interest?" },
      { id: "concept", label: "Concept", help: "What is the main topic, phenomenon, or issue being examined?" },
      { id: "context", label: "Context", help: "What is the setting, environment, or circumstance?" },
    ],
  },
  {
    id: "PICO",
    label: "PICO — Systematic Reviews of Interventions",
    fields: [
      { id: "population", label: "Population", help: "Who are the participants or patients?" },
      { id: "intervention", label: "Intervention", help: "What is being done, applied, or tested?" },
      { id: "comparison", label: "Comparison", help: "What is it being compared against, if anything?" },
      { id: "outcome", label: "Outcome", help: "What is being measured or expected to change?" },
    ],
  },
  {
    id: "PEO",
    label: "PEO — Qualitative & Exploratory Reviews",
    fields: [
      { id: "population", label: "Population", help: "Who is the focus of the review?" },
      { id: "exposure", label: "Exposure", help: "What are they exposed to, experiencing, or affected by?" },
      { id: "outcome", label: "Outcome", help: "What is the resulting experience, perception, or effect?" },
    ],
  },
  {
    id: "SPIDER",
    label: "SPIDER — Qualitative & Mixed Methods Reviews",
    fields: [
      { id: "sample", label: "Sample", help: "Who is being studied or represented?" },
      { id: "phenomenon", label: "Phenomenon of Interest", help: "What experience, behavior, or issue is being explored?" },
      { id: "design", label: "Design", help: "What study designs or methods are relevant?" },
      { id: "evaluation", label: "Evaluation", help: "What outcomes, views, or experiences are being evaluated?" },
      { id: "researchType", label: "Research type", help: "What type of research should be included?" },
    ],
  },
] as const;

export function getFrameworkDefinition(framework: string | undefined) {
  return researchFrameworks.find((item) => item.id === framework) || researchFrameworks[1];
}

export function isFrameworkId(value: unknown): value is FrameworkId {
  return researchFrameworks.some((framework) => framework.id === value);
}

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
