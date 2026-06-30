export type ProcessingAction = "idle" | "loading" | "cleaning" | "transcribing" | "translating";

export const languageLabels: Record<string, string> = {
  auto: "Auto detect",
  english: "English",
  hausa: "Hausa",
  yoruba: "Yoruba",
  igbo: "Igbo",
  french: "French",
};
