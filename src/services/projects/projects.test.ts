import { describe, test, expect, mock, beforeEach } from "bun:test";

// Mock fs before importing the module
const mockReaddirSync = mock(() => [] as string[]);
const mockStatSync = mock(() => ({ isDirectory: () => true }));

mock.module("fs", () => ({
  readdirSync: mockReaddirSync,
  statSync: mockStatSync,
}));

const { getProjects } = await import("./index.ts");

describe("getProjects", () => {
  beforeEach(() => {
    mockReaddirSync.mockReset();
    mockStatSync.mockReset();
  });

  test("returns empty array when no entries", () => {
    mockReaddirSync.mockReturnValue([]);
    const result = getProjects();
    expect(result).toEqual([]);
  });

  test("filters out hidden directories", () => {
    mockReaddirSync.mockReturnValue([".hidden", "visible-project"]);
    mockStatSync.mockReturnValue({ isDirectory: () => true });

    const result = getProjects();
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("visible-project");
  });

  test("filters out files (non-directories)", () => {
    mockReaddirSync.mockReturnValue(["my-project", "readme.md"]);
    mockStatSync.mockImplementation(((path: string) => ({
      isDirectory: () => !path.endsWith("readme.md"),
    })) as any);

    const result = getProjects();
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("my-project");
  });

  test("formats display name from kebab-case", () => {
    mockReaddirSync.mockReturnValue(["my-cool-project"]);
    mockStatSync.mockReturnValue({ isDirectory: () => true });

    const result = getProjects();
    expect(result[0]!.displayName).toBe("My Cool Project");
  });

  test("generates correct path", () => {
    mockReaddirSync.mockReturnValue(["boids"]);
    mockStatSync.mockReturnValue({ isDirectory: () => true });

    const result = getProjects();
    expect(result[0]!.path).toBe("/projects-showcase/boids/index.html");
  });

  test("returns correct Project shape", () => {
    mockReaddirSync.mockReturnValue(["test-project"]);
    mockStatSync.mockReturnValue({ isDirectory: () => true });

    const result = getProjects();
    expect(result[0]!).toEqual({
      name: "test-project",
      displayName: "Test Project",
      path: "/projects-showcase/test-project/index.html",
    });
  });
});
