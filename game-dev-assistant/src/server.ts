#!/usr/bin/env node
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { loadConfig } from "./config.js";
import {
  checkLocalLlm,
  detectEngine,
  resolveInProject,
  walkFiles,
  pathExists,
} from "./util.js";
import {
  scaffoldUnity,
  scaffoldUnreal,
  UNITY_KINDS,
  UNREAL_KINDS,
  type ScaffoldFile,
} from "./templates.js";

const config = loadConfig();
const GDD_FILE = "GameDesignDoc.md";
const MAX_READ_BYTES = 200_000;

/** Wrap a plain string into the MCP text-content result shape. */
function text(s: string, isError = false) {
  return { content: [{ type: "text" as const, text: s }], isError };
}

/** Resolve the engine to use: explicit config wins, otherwise detect from the project. */
async function effectiveEngine(): Promise<"unity" | "unreal" | "unknown"> {
  if (config.engine !== "auto") return config.engine;
  return (await detectEngine(config.projectRoot)).engine;
}

async function writeScaffoldFiles(files: ScaffoldFile[], overwrite: boolean) {
  const written: string[] = [];
  const skipped: string[] = [];
  for (const f of files) {
    const abs = resolveInProject(config.projectRoot, f.path);
    if (!overwrite && (await pathExists(abs))) {
      skipped.push(f.path);
      continue;
    }
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, f.content, "utf8");
    written.push(f.path);
  }
  return { written, skipped };
}

const registeredTools: string[] = [];
const server = new McpServer({ name: "game-dev-assistant", version: "0.1.0" });

function register(
  name: string,
  cfg: { title: string; description: string; inputSchema?: z.ZodRawShape },
  handler: (args: any) => Promise<ReturnType<typeof text>>
) {
  registeredTools.push(name);
  server.registerTool(
    name,
    { title: cfg.title, description: cfg.description, inputSchema: cfg.inputSchema ?? {} },
    handler as any
  );
}

// 1. check_local_llm ---------------------------------------------------------
register(
  "check_local_llm",
  {
    title: "Check local LLM",
    description:
      "Ping the configured OpenAI-compatible endpoint (LM Studio by default) and list the models it currently serves. Use this to confirm the local model stack is up before relying on it.",
  },
  async () => {
    const status = await checkLocalLlm(config.lmstudioBaseUrl, config.llmApiKey);
    if (!status.reachable) {
      return text(
        `NOT reachable at ${status.baseUrl}\nError: ${status.error}\n\n` +
          `Fix: in LM Studio open the Developer tab, load a model, and click "Start Server" (default port 1234). ` +
          `Then confirm ${status.baseUrl}/models responds.`,
        true
      );
    }
    const list = status.models.length
      ? status.models.map((m) => `  - ${m}`).join("\n")
      : "  (server up, but no models loaded — load one in LM Studio)";
    return text(`Reachable at ${status.baseUrl}\nModels served:\n${list}`);
  }
);

// 2. detect_engine -----------------------------------------------------------
register(
  "detect_engine",
  {
    title: "Detect game engine",
    description:
      "Inspect the project root and report whether it is a Unity or Unreal project, with the evidence used.",
  },
  async () => {
    const det = await detectEngine(config.projectRoot);
    const configured = config.engine === "auto" ? "auto-detect" : config.engine;
    return text(
      `Project root: ${config.projectRoot}\n` +
        `Configured engine: ${configured}\n` +
        `Detected engine: ${det.engine}\n` +
        (det.evidence.length ? `Evidence:\n${det.evidence.map((e) => `  - ${e}`).join("\n")}` : "Evidence: none found")
    );
  }
);

// 3. project_summary ---------------------------------------------------------
register(
  "project_summary",
  {
    title: "Summarize project",
    description:
      "High-level orientation: detected engine, top-level folders, and a count of source files by type. Call this first when starting work on an unfamiliar project.",
  },
  async () => {
    const det = await detectEngine(config.projectRoot);
    let topLevel: string[] = [];
    try {
      const entries = await fs.readdir(config.projectRoot, { withFileTypes: true });
      topLevel = entries
        .filter((e) => e.isDirectory() && !e.name.startsWith("."))
        .map((e) => e.name + "/")
        .sort();
    } catch {
      /* ignore */
    }
    const exts = det.engine === "unreal" ? [".h", ".cpp", ".cs"] : [".cs"];
    const files = await walkFiles(config.projectRoot, { exts, limit: 2000 });
    const byExt = new Map<string, number>();
    for (const f of files) {
      const e = path.extname(f.path).toLowerCase();
      byExt.set(e, (byExt.get(e) ?? 0) + 1);
    }
    const counts = [...byExt.entries()].map(([e, c]) => `  ${e}: ${c}`).join("\n") || "  (none found)";
    return text(
      `Engine: ${det.engine}\n` +
        `Root: ${config.projectRoot}\n\n` +
        `Top-level folders:\n${topLevel.map((t) => `  ${t}`).join("\n") || "  (none)"}\n\n` +
        `Source file counts:\n${counts}`
    );
  }
);

// 4. list_scripts ------------------------------------------------------------
register(
  "list_scripts",
  {
    title: "List source files",
    description:
      "List source files in the project (Unity: .cs; Unreal: .h/.cpp/.cs), optionally filtered by a path substring.",
    inputSchema: {
      filter: z.string().optional().describe("Case-insensitive substring to match against the file path."),
      limit: z.number().int().positive().max(1000).optional().describe("Max results (default 200)."),
    },
  },
  async ({ filter, limit }) => {
    const det = await detectEngine(config.projectRoot);
    const exts = det.engine === "unreal" ? [".h", ".cpp", ".cs"] : [".cs"];
    const files = await walkFiles(config.projectRoot, {
      exts,
      contains: filter,
      limit: limit ?? 200,
    });
    if (!files.length) return text("No matching source files found.");
    const lines = files.map((f) => `  ${f.path}  (${f.bytes} bytes)`).join("\n");
    return text(`${files.length} file(s):\n${lines}`);
  }
);

// 5. read_file ---------------------------------------------------------------
register(
  "read_file",
  {
    title: "Read project file",
    description:
      "Read a UTF-8 text file from inside the project root. Paths are confined to the project; traversal outside is rejected.",
    inputSchema: {
      path: z.string().describe("Project-relative path, e.g. Assets/Scripts/Player.cs"),
    },
  },
  async ({ path: p }) => {
    let abs: string;
    try {
      abs = resolveInProject(config.projectRoot, p);
    } catch (e) {
      return text(e instanceof Error ? e.message : String(e), true);
    }
    try {
      const stat = await fs.stat(abs);
      if (stat.size > MAX_READ_BYTES) {
        const buf = await fs.readFile(abs, "utf8");
        return text(
          `(truncated: file is ${stat.size} bytes, showing first ${MAX_READ_BYTES})\n\n` +
            buf.slice(0, MAX_READ_BYTES)
        );
      }
      const buf = await fs.readFile(abs, "utf8");
      return text(buf);
    } catch (e) {
      return text(`Cannot read ${p}: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  }
);

// 6. write_file --------------------------------------------------------------
register(
  "write_file",
  {
    title: "Write project file",
    description:
      "Create or overwrite a UTF-8 text file inside the project root (parent folders are created). Confined to the project; traversal outside is rejected.",
    inputSchema: {
      path: z.string().describe("Project-relative path to write."),
      content: z.string().describe("Full file contents."),
      overwrite: z.boolean().optional().describe("Allow overwriting an existing file (default true)."),
    },
  },
  async ({ path: p, content, overwrite }) => {
    let abs: string;
    try {
      abs = resolveInProject(config.projectRoot, p);
    } catch (e) {
      return text(e instanceof Error ? e.message : String(e), true);
    }
    if (overwrite === false && (await pathExists(abs))) {
      return text(`Refused: ${p} already exists and overwrite is false.`, true);
    }
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf8");
    return text(`Wrote ${content.length} chars to ${p}`);
  }
);

// 7. scaffold ----------------------------------------------------------------
register(
  "scaffold",
  {
    title: "Scaffold engine boilerplate",
    description:
      "Generate engine-idiomatic boilerplate and write it into the project. " +
      `Unity kinds: ${UNITY_KINDS.join(", ")}. Unreal kinds: ${UNREAL_KINDS.join(", ")}. ` +
      "The engine is taken from configuration or auto-detected.",
    inputSchema: {
      kind: z
        .string()
        .describe(`One of the Unity or Unreal kinds (Unity: ${UNITY_KINDS.join("/")}; Unreal: ${UNREAL_KINDS.join("/")}).`),
      name: z.string().describe("Class/type name, e.g. PlayerController."),
      namespace: z.string().optional().describe("Unity only: C# namespace to wrap the type in."),
      module: z.string().optional().describe("Unreal only: module name for the API macro/path (default Game)."),
      overwrite: z.boolean().optional().describe("Overwrite existing files (default false)."),
    },
  },
  async ({ kind, name, namespace, module, overwrite }) => {
    const engine = await effectiveEngine();
    if (engine === "unknown") {
      return text(
        "Could not determine the engine. Set GAMEDEV_ENGINE=unity|unreal (or --engine=) and point the server at your project root.",
        true
      );
    }
    let result;
    if (engine === "unity") {
      if (!(UNITY_KINDS as readonly string[]).includes(kind)) {
        return text(`Unknown Unity kind "${kind}". Valid: ${UNITY_KINDS.join(", ")}`, true);
      }
      result = scaffoldUnity(kind as any, name, namespace);
    } else {
      if (!(UNREAL_KINDS as readonly string[]).includes(kind)) {
        return text(`Unknown Unreal kind "${kind}". Valid: ${UNREAL_KINDS.join(", ")}`, true);
      }
      result = scaffoldUnreal(kind as any, name, module ?? "Game");
    }

    const { written, skipped } = await writeScaffoldFiles(result.files, overwrite ?? false);
    const parts = [`Engine: ${engine} — kind: ${kind}`];
    if (written.length) parts.push(`Created:\n${written.map((f) => `  + ${f}`).join("\n")}`);
    if (skipped.length)
      parts.push(`Skipped (exists, pass overwrite=true to replace):\n${skipped.map((f) => `  = ${f}`).join("\n")}`);
    if (result.notes.length) parts.push(`Notes:\n${result.notes.map((nn) => `  * ${nn}`).join("\n")}`);
    return text(parts.join("\n\n"));
  }
);

// 8. gdd_read ----------------------------------------------------------------
register(
  "gdd_read",
  {
    title: "Read game design doc",
    description:
      `Read the project's living Game Design Document (${GDD_FILE} at the project root). This is the assistant's persistent memory of the game's vision, mechanics, and decisions across sessions.`,
  },
  async () => {
    const abs = resolveInProject(config.projectRoot, GDD_FILE);
    if (!(await pathExists(abs))) {
      return text(`No ${GDD_FILE} yet. Use gdd_update to create it.`);
    }
    return text(await fs.readFile(abs, "utf8"));
  }
);

// 9. gdd_update --------------------------------------------------------------
register(
  "gdd_update",
  {
    title: "Update game design doc",
    description:
      `Append a section to, or replace, the Game Design Document (${GDD_FILE}). Use append to log decisions/mechanics over time; use replace to rewrite the whole doc.`,
    inputSchema: {
      mode: z.enum(["append", "replace"]).describe("append a section, or replace the whole document."),
      content: z.string().describe("Markdown content to write."),
      section: z
        .string()
        .optional()
        .describe("Append mode: optional heading to add above the content (e.g. 'Combat System')."),
    },
  },
  async ({ mode, content, section }) => {
    const abs = resolveInProject(config.projectRoot, GDD_FILE);
    if (mode === "replace") {
      await fs.writeFile(abs, content.endsWith("\n") ? content : content + "\n", "utf8");
      return text(`Replaced ${GDD_FILE} (${content.length} chars).`);
    }
    const existed = await pathExists(abs);
    let block = "";
    if (!existed) block += `# Game Design Document\n\n`;
    if (section) block += `## ${section}\n\n`;
    block += content.endsWith("\n") ? content : content + "\n";
    block = (existed ? "\n" : "") + block;
    await fs.appendFile(abs, block, "utf8");
    return text(`Appended ${block.length} chars to ${GDD_FILE}${section ? ` under "## ${section}"` : ""}.`);
  }
);

// ---------------------------------------------------------------------------

async function runSmoke() {
  const det = await detectEngine(config.projectRoot);
  const uni = scaffoldUnity("monobehaviour", "SmokePlayer", "Smoke");
  const unr = scaffoldUnreal("actor", "SmokeActor", "Game");
  const out = {
    ok: true,
    registeredTools,
    projectRoot: config.projectRoot,
    detectedEngine: det.engine,
    lmstudioBaseUrl: config.lmstudioBaseUrl,
    sampleUnityFile: uni.files[0]?.path,
    sampleUnrealFiles: unr.files.map((f) => f.path),
  };
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

async function main() {
  if (process.argv.includes("--smoke")) {
    await runSmoke();
    return;
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe for logs; stdout is the JSON-RPC channel and must stay clean.
  process.stderr.write(
    `[game-dev-assistant] ready — engine=${config.engine} root=${config.projectRoot} llm=${config.lmstudioBaseUrl}\n`
  );
}

main().catch((err) => {
  process.stderr.write(`[game-dev-assistant] fatal: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
