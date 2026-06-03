import { describe, expect, test } from "bun:test";
import { extractHashtags } from "./hashtags";

describe("extractHashtags", () => {
  test("returns empty for no tags", () => {
    expect(extractHashtags("just some text")).toEqual([]);
  });

  test("extracts a single tag", () => {
    expect(extractHashtags("hello #world")).toEqual(["world"]);
  });

  test("lowercases and dedupes", () => {
    expect(extractHashtags("#Foo bar #foo #FOO")).toEqual(["foo"]);
  });

  test("supports hyphenated tags", () => {
    expect(extractHashtags("#multi-word tag")).toEqual(["multi-word"]);
  });

  test("ignores bare # and punctuation", () => {
    expect(extractHashtags("# not a tag, but #yes!")).toEqual(["yes"]);
  });

  test("preserves first-seen order", () => {
    expect(extractHashtags("#a #b #c #a")).toEqual(["a", "b", "c"]);
  });
});
