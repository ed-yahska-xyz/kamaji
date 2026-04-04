import { describe, test, expect } from "bun:test";
import { InvalidPath } from "./errors";

describe("InvalidPath", () => {
  test("is an instance of Error", () => {
    const error = new InvalidPath("test");
    expect(error).toBeInstanceOf(Error);
  });

  test("has correct name", () => {
    const error = new InvalidPath("test");
    expect(error.name).toBe("InvalidPath");
  });

  test("preserves error message", () => {
    const error = new InvalidPath("path is empty");
    expect(error.message).toBe("path is empty");
  });

  test("can be caught as Error", () => {
    expect(() => {
      throw new InvalidPath("bad path");
    }).toThrow("bad path");
  });
});
