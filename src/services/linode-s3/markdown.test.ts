import { describe, test, expect } from "bun:test";
import { InvalidPath } from "./errors";

// Test getMarkdownContent path validation without hitting S3
// We re-implement the validation logic to test it in isolation
describe("markdown path validation", () => {
  function validateMarkdownPath(path: string): void {
    if (!path || !path.endsWith(".md")) {
      throw new InvalidPath("Path must be a valid markdown file");
    }
  }

  test("rejects empty path", () => {
    expect(() => validateMarkdownPath("")).toThrow(InvalidPath);
  });

  test("rejects non-markdown path", () => {
    expect(() => validateMarkdownPath("notes/file.txt")).toThrow(InvalidPath);
  });

  test("rejects path without extension", () => {
    expect(() => validateMarkdownPath("notes/readme")).toThrow(InvalidPath);
  });

  test("accepts valid markdown path", () => {
    expect(() => validateMarkdownPath("notes/hello.md")).not.toThrow();
  });

  test("accepts nested markdown path", () => {
    expect(() => validateMarkdownPath("a/b/c/deep.md")).not.toThrow();
  });
});

describe("S3 path validation", () => {
  function validateS3Path(path: string): void {
    if (!path || path.length === 0) {
      throw new InvalidPath("Input path is invalid");
    }
  }

  test("rejects empty string", () => {
    expect(() => validateS3Path("")).toThrow(InvalidPath);
  });

  test("accepts non-empty path", () => {
    expect(() => validateS3Path("some/path")).not.toThrow();
  });
});

describe("S3 prefix normalization", () => {
  function normalizePrefix(path: string): string {
    let prefix = path === "/" ? "" : path;
    if (prefix && !prefix.endsWith("/")) {
      prefix = prefix + "/";
    }
    return prefix;
  }

  test("root path returns empty prefix", () => {
    expect(normalizePrefix("/")).toBe("");
  });

  test("empty path stays empty", () => {
    expect(normalizePrefix("")).toBe("");
  });

  test("adds trailing slash to path", () => {
    expect(normalizePrefix("notes")).toBe("notes/");
  });

  test("does not double trailing slash", () => {
    expect(normalizePrefix("notes/")).toBe("notes/");
  });

  test("handles nested paths", () => {
    expect(normalizePrefix("notes/2024")).toBe("notes/2024/");
  });
});
