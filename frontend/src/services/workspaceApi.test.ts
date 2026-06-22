import { afterEach, describe, expect, it, vi } from "vitest";
import { generateSearchTerm, loadProject, loadWorkspace, searchSource } from "./workspaceApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadWorkspace", () => {
  it("loads the current user and project summaries", async () => {
    const user = {
      name: "Dr. Joy Aifuobhokhan",
      initials: "JA",
      department: "Sydani Institute for Research and Innovation",
    };
    const projects = [
      {
        id: "paper-1",
        title: "Example",
        theme: "Health",
        researchLead: "Researcher",
        framework: "PICO",
        geography: "Nigeria",
        updatedAt: "Just now",
        stageId: "idea",
        stageLabel: "Ideation",
        stageNumber: 1,
        progress: 20,
        status: "Ideation",
        collaborators: [],
      },
    ];

    const fetchMock = vi.fn((path) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(path === "/api/users/me" ? user : projects),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const workspace = await loadWorkspace();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/me",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(workspace.user).toEqual(user);
    expect(workspace.papers).toEqual(projects);
  });

  it("loads and normalizes a project detail", async () => {
    const project = {
      id: "paper-1",
      title: "Example",
      theme: "Health",
      researchLead: "Researcher",
      framework: "PICO",
      geography: "Nigeria",
      updatedAt: "Just now",
      researchQuestion: "Question",
      collaborators: [],
      articles: [],
      sources: [
        {
          id: "pubmed",
          name: "PubMed",
          enabled: true,
          resultCount: 0,
          lastRun: "",
          searchTerm: "example term",
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(project),
        }),
      ),
    );

    const result = await loadProject("paper-1");

    expect(fetch).toHaveBeenCalledWith(
      "/api/projects/paper-1",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(result.sources).toHaveLength(4);
    expect(result.sources[0].searchTerm).toBe("example term");
  });

  it("rejects when an API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, status: 503 })),
    );

    await expect(loadWorkspace()).rejects.toThrow("Request failed with status 503");
  });

  it("posts a source search term to the backend", async () => {
    const searchResponse = {
      sourceId: "pubmed",
      sourceName: "PubMed",
      articles: [],
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(searchResponse),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchSource({ id: "pubmed", name: "PubMed", searchTerm: "malaria" }),
    ).resolves.toEqual(searchResponse);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/search",
      expect.objectContaining({
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceId: "pubmed",
          sourceName: "PubMed",
          searchTerm: "malaria",
        }),
      }),
    );
  });

  it("uses the backend detail message for search failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ detail: "Google search is not configured" }),
        }),
      ),
    );

    await expect(
      searchSource({ id: "scholar", name: "Google Scholar", searchTerm: "malaria" }),
    ).rejects.toThrow("Google search is not configured");
  });

  it("posts project context to generate a source search term", async () => {
    const termResponse = {
      sourceId: "pubmed",
      sourceName: "PubMed",
      searchTerm: "malaria AND Nigeria",
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(termResponse),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateSearchTerm(
        {
          title: "SMC uptake",
          theme: "Malaria",
          framework: "PICO",
          geography: "Nigeria",
          researchQuestion: "What affects uptake?",
        },
        { id: "pubmed", name: "PubMed" },
      ),
    ).resolves.toEqual(termResponse);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/search/terms",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          sourceId: "pubmed",
          sourceName: "PubMed",
          title: "SMC uptake",
          theme: "Malaria",
          framework: "PICO",
          geography: "Nigeria",
          researchQuestion: "What affects uptake?",
        }),
      }),
    );
  });
});
