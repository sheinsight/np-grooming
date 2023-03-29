import path from "node:path";

export function dirname(url: string) {
  return path.dirname(new URL(url).pathname);
}
