import * as path from "node:path";

export type Engine = "unity" | "unreal" | "auto";

export interface Config {
  /** Absolute path to the game project the assistant is allowed to touch. */
  projectRoot: string;
  /** Which engine's conventions to use. "auto" = detect from projectRoot. */
  engine: Engine;
  /** OpenAI-compatible base URL for LM Studio (or a LiteLLM proxy in front of it). */
  lmstudioBaseUrl: string;
  /** Optional bearer token for the LLM endpoint (LM Studio ignores it; LiteLLM may require it). */
  llmApiKey?: string;
}

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

export function loadConfig(): Config {
  const projectRoot = path.resolve(
    argValue("project") ?? process.env.GAMEDEV_PROJECT_ROOT ?? process.cwd()
  );

  const rawEngine = (argValue("engine") ?? process.env.GAMEDEV_ENGINE ?? "auto").toLowerCase();
  const engine: Engine =
    rawEngine === "unity" || rawEngine === "unreal" ? rawEngine : "auto";

  const lmstudioBaseUrl = (
    argValue("lmstudio") ??
    process.env.LMSTUDIO_BASE_URL ??
    "http://localhost:1234/v1"
  ).replace(/\/+$/, "");

  const llmApiKey = argValue("api-key") ?? process.env.LMSTUDIO_API_KEY ?? process.env.LLM_API_KEY;

  return { projectRoot, engine, lmstudioBaseUrl, llmApiKey };
}
