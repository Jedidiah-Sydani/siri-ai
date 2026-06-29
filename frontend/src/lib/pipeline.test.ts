import { describe, expect, it } from "vitest";
import {
  getAllSearchTerms,
  getPaperStage,
  getProjectStatus,
  getSelectedArticles,
  getUniqueCount,
  isStageComplete,
  matchesProjectFilter,
  resolveActiveStage,
} from "./pipeline";
import { projectStatus } from "../data/constants";
import type { Article, Project } from "../types";

function makePaper(overrides: Partial<Project> = {}): Project {
  return {
    id: "p",
    title: "Title",
    theme: "Theme",
    researchLead: "Research Lead",
    framework: "PICO",
    frameworkFields: {
      population: "Children",
      intervention: "SMC",
      comparison: "Standard care",
      outcome: "Uptake",
    },
    geography: "Geography",
    updatedAt: "Just now",
    researchQuestion: "Question",
    sources: [{ id: "pubmed", name: "PubMed", enabled: true, resultCount: 0, lastRun: "", searchTerm: "" }],
    articles: [],
    ...overrides,
    collaborators: overrides.collaborators ?? [],
  };
}

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: `a-${Math.random()}`,
    source: "PubMed",
    doi: "10.1/x",
    title: "A",
    author: "Author A",
    sourceUrl: "https://doi.org/10.1/x",
    year: "2024",
    fullTextStatus: "Not pulled",
    selected: false,
    reviewDecision: "Unreviewed",
    ...overrides,
  };
}

describe("getPaperStage", () => {
  it("is 'idea' with no terms and no articles", () => {
    expect(getPaperStage(makePaper())).toBe("idea");
  });

  it("is 'search' once a source has a search term", () => {
    expect(
      getPaperStage(
        makePaper({
          sources: [{ id: "pubmed", name: "PubMed", enabled: true, resultCount: 0, lastRun: "", searchTerm: "x" }],
        }),
      ),
    ).toBe(
      "search",
    );
  });

  it("stays 'search' when records exist but none are selected", () => {
    expect(getPaperStage(makePaper({ articles: [makeArticle({ selected: false })] }))).toBe("search");
  });

  it("advances to 'screening' once a record is selected", () => {
    expect(getPaperStage(makePaper({ articles: [makeArticle({ selected: true })] }))).toBe("screening");
  });

  it("advances to 'retrieval' once a selected record is pulled", () => {
    const paper = makePaper({ articles: [makeArticle({ selected: true, fullTextStatus: "Pulled" })] });
    expect(getPaperStage(paper)).toBe("retrieval");
  });

  it("advances to 'review' once a selected record has a decision", () => {
    const paper = makePaper({ articles: [makeArticle({ selected: true, reviewDecision: "Included" })] });
    expect(getPaperStage(paper)).toBe("review");
  });
});

describe("getProjectStatus (derived, never stored)", () => {
  it("is 'Ideation' at the ideation stage", () => {
    expect(getProjectStatus(makePaper())).toBe(projectStatus.IDEA);
  });

  it("is 'In progress' once work begins but review is incomplete", () => {
    const paper = makePaper({ articles: [makeArticle({ selected: true, fullTextStatus: "Pulled" })] });
    expect(getProjectStatus(paper)).toBe(projectStatus.IN_PROGRESS);
  });

  it("is 'Complete' only when every selected record is reviewed", () => {
    const paper = makePaper({
      articles: [
        makeArticle({ selected: true, reviewDecision: "Included" }),
        makeArticle({ selected: true, reviewDecision: "Excluded" }),
      ],
    });
    expect(getProjectStatus(paper)).toBe(projectStatus.COMPLETE);
  });

  it("stays 'In progress' if any selected record is still unreviewed", () => {
    const paper = makePaper({
      articles: [
        makeArticle({ selected: true, reviewDecision: "Included" }),
        makeArticle({ selected: true, reviewDecision: "Unreviewed" }),
      ],
    });
    expect(getProjectStatus(paper)).toBe(projectStatus.IN_PROGRESS);
  });

  it("ignores unselected records when deciding completeness", () => {
    const paper = makePaper({
      articles: [
        makeArticle({ selected: true, reviewDecision: "Included" }),
        makeArticle({ selected: false, reviewDecision: "Unreviewed" }),
      ],
    });
    expect(getProjectStatus(paper)).toBe(projectStatus.COMPLETE);
  });

  it("uses Archived when a paper has been archived", () => {
    expect(getProjectStatus(makePaper({ archived: true }))).toBe(projectStatus.ARCHIVED);
  });
});

describe("getUniqueCount", () => {
  it("counts distinct records by DOI", () => {
    const articles = [
      makeArticle({ doi: "10.1/same" }),
      makeArticle({ doi: "10.1/same" }),
      makeArticle({ doi: "10.1/other" }),
    ];
    expect(getUniqueCount(articles)).toBe(2);
  });
});

describe("getSelectedArticles", () => {
  it("returns only selected records", () => {
    const paper = makePaper({
      articles: [makeArticle({ selected: true }), makeArticle({ selected: false })],
    });
    expect(getSelectedArticles(paper)).toHaveLength(1);
  });
});

describe("getAllSearchTerms", () => {
  it("aggregates and de-duplicates across sources", () => {
    const paper = makePaper({
      sources: [
        { id: "pubmed", name: "PubMed", enabled: true, resultCount: 0, lastRun: "", searchTerm: "a" },
        { id: "scholar", name: "Google Scholar", enabled: true, resultCount: 0, lastRun: "", searchTerm: "a" },
        { id: "scopus", name: "Scopus", enabled: true, resultCount: 0, lastRun: "", searchTerm: "b" },
      ],
    });
    expect(getAllSearchTerms(paper)).toEqual(["a", "b"]);
  });
});

describe("isStageComplete", () => {
  it("ideation requires title, question and active framework fields", () => {
    expect(isStageComplete(makePaper(), "idea")).toBe(true);
    expect(isStageComplete(makePaper({ researchQuestion: "" }), "idea")).toBe(false);
    expect(isStageComplete(makePaper({ frameworkFields: { population: "Children" } }), "idea")).toBe(false);
  });

  it("screening is complete once any record is selected", () => {
    expect(isStageComplete(makePaper({ articles: [makeArticle({ selected: true })] }), "screening")).toBe(
      true,
    );
  });
});

describe("resolveActiveStage", () => {
  it("uses a valid stage id from the URL", () => {
    expect(resolveActiveStage("search", makePaper())).toBe("search");
  });

  it("falls back to the paper's furthest stage for an invalid id", () => {
    expect(resolveActiveStage("bogus", makePaper())).toBe("idea");
    expect(resolveActiveStage(undefined, makePaper())).toBe("idea");
  });
});

describe("matchesProjectFilter", () => {
  it("matches 'all' regardless of status", () => {
    expect(matchesProjectFilter(makePaper(), "all")).toBe(true);
  });

  it("matches by derived status", () => {
    const idea = makePaper();
    expect(matchesProjectFilter(idea, "progress")).toBe(false);
    expect(matchesProjectFilter(idea, "complete")).toBe(false);
  });

  it("moves archived projects out of active filters", () => {
    const archived = makePaper({ archived: true });
    expect(matchesProjectFilter(archived, "all")).toBe(false);
    expect(matchesProjectFilter(archived, "progress")).toBe(false);
    expect(matchesProjectFilter(archived, "complete")).toBe(false);
    expect(matchesProjectFilter(archived, "archived")).toBe(true);
  });
});
