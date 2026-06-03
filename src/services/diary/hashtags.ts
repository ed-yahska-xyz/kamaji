const TAG_RE = /#([\w-]+)/g;

export function extractHashtags(body: string): string[] {
  const tags = new Set<string>();
  for (const match of body.matchAll(TAG_RE)) {
    tags.add(match[1]!.toLowerCase());
  }
  return [...tags];
}
