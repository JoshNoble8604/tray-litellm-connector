import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Resolve `p` (relative or absolute) against `root` and guarantee the result
 * stays inside `root`. Throws on traversal (`../`) or absolute escapes.
 * This is the single choke-point that keeps the assistant confined to the project.
 */
export function resolveInProject(root: string, p: string): string {
  const abs = path.resolve(root, p);
  const rel = path.relative(root, abs);
  if (rel === "" ) return abs;
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(
      `Path "${p}" resolves outside the project root. The assistant may only read/write inside ${root}.`
    );
  }
  return abs;
}

const DEFAULT_IGNORE = new Set([
  "node_modules",
  ".git",
  "Library", // Unity import cache
  "Temp",
  "Obj",
  "obj",
  "Build",
  "Builds",
  "Logs",
  "Binaries", // Unreal
  "Intermediate",
  "DerivedDataCache",
  "Saved",
  ".vs",
  ".idea",
  "dist",
]);

export interface WalkOptions {
  exts?: string[]; // e.g. [".cs"] — case-insensitive; empty/omitted = any
  contains?: string; // case-insensitive substring match on the file path
  limit?: number;
  ignoreDirs?: Set<string>;
}

export interface FoundFile {
  path: string; // project-relative, forward slashes
  bytes: number;
}

/** Recursively list files under `root` with lightweight filtering. */
export async function walkFiles(root: string, opts: WalkOptions = {}): Promise<FoundFile[]> {
  const exts = (opts.exts ?? []).map((e) => e.toLowerCase());
  const contains = opts.contains?.toLowerCase();
  const ignore = opts.ignoreDirs ?? DEFAULT_IGNORE;
  const limit = opts.limit ?? 500;
  const out: FoundFile[] = [];

  async function recurse(dir: string): Promise<void> {
    if (out.length >= limit) return;
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (out.length >= limit) return;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (ignore.has(entry.name)) continue;
        await recurse(abs);
      } else if (entry.isFile()) {
        if (exts.length && !exts.includes(path.extname(entry.name).toLowerCase())) continue;
        const relPath = path.relative(root, abs).split(path.sep).join("/");
        if (contains && !relPath.toLowerCase().includes(contains)) continue;
        let bytes = 0;
        try {
          bytes = (await fs.stat(abs)).size;
        } catch {
          /* ignore */
        }
        out.push({ path: relPath, bytes });
      }
    }
  }

  await recurse(root);
  out.sort((a, b) => a.path.localeCompare(b.path));
  return out;
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export interface EngineDetection {
  engine: "unity" | "unreal" | "unknown";
  evidence: string[];
}

/** Detect the engine from marker files/folders in the project root. */
export async function detectEngine(root: string): Promise<EngineDetection> {
  const evidence: string[] = [];

  const unityMarkers = ["Assets", "ProjectSettings", "Packages"];
  for (const m of unityMarkers) {
    if (await pathExists(path.join(root, m))) evidence.push(`Unity: found ${m}/`);
  }

  let unrealEvidence = 0;
  try {
    const top = await fs.readdir(root);
    const uproject = top.find((f) => f.toLowerCase().endsWith(".uproject"));
    if (uproject) {
      evidence.push(`Unreal: found ${uproject}`);
      unrealEvidence++;
    }
  } catch {
    /* ignore */
  }
  for (const m of ["Source", "Content", "Config"]) {
    if (await pathExists(path.join(root, m))) {
      // Content/ + Source/ strongly imply Unreal; Config/ alone is weak.
      if (m !== "Config") unrealEvidence++;
    }
  }

  const unityScore = evidence.filter((e) => e.startsWith("Unity")).length;
  if (unrealEvidence >= 1 && unrealEvidence >= unityScore) {
    return { engine: "unreal", evidence };
  }
  if (unityScore >= 1) return { engine: "unity", evidence };
  return { engine: "unknown", evidence };
}

export interface LlmStatus {
  reachable: boolean;
  baseUrl: string;
  models: string[];
  error?: string;
}

/** Ping an OpenAI-compatible /models endpoint (LM Studio, or LiteLLM in front of it). */
export async function checkLocalLlm(
  baseUrl: string,
  apiKey?: string,
  timeoutMs = 5000
): Promise<LlmStatus> {
  const url = `${baseUrl}/models`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: controller.signal,
    });
    if (!res.ok) {
      return { reachable: false, baseUrl, models: [], error: `HTTP ${res.status} from ${url}` };
    }
    const body = (await res.json()) as { data?: Array<{ id?: string }> };
    const models = (body.data ?? []).map((m) => m.id).filter((x): x is string => !!x);
    return { reachable: true, baseUrl, models };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { reachable: false, baseUrl, models: [], error: msg };
  } finally {
    clearTimeout(timer);
  }
}
