# game-dev-assistant (local-LLM MCP server)

A small, self-contained **MCP server** that turns a **local LLM running in LM Studio** into a
useful *dev-time* coding assistant for a **Unity or Unreal** game project.

It is engine-aware and complements the engine's own MCP server: the engine MCP drives the *live
editor*, while this server gives the model the things it otherwise lacks —
**code scaffolding, project orientation, project-confined file access, a persistent Game Design
Document, and a diagnostic to confirm the local model stack is live.**

This lives inside the LiteLLM Tray connector repo but is a **standalone Node project** — it has its
own `package.json`/`tsconfig.json` and does not touch the Tray connector build.

## The setup at a glance

```
RTX 5090 (32 GB) + 64 GB DDR5
        │
        ▼
   LM Studio  ──────────────────────────────►  loads your model, serves OpenAI-compatible API
   (MCP host) │                                 (http://localhost:1234/v1) and hosts MCP servers
              ├─► Engine MCP  (Unity MCP / Unreal 5.8 MCP)  → live editor control
              └─► game-dev-assistant (this)                → scaffold, orient, design-doc, diagnostics
```

Any MCP client works — **LM Studio** (0.3.17+ is an MCP host), **Claude Code**, **Cursor**, **Cline**.
Point whichever one you use at LM Studio's endpoint for the model, and add this server for the tools.

## Install & build

Requires Node 18.17+.

```bash
cd game-dev-assistant
npm install
npm run build          # compiles to dist/
node dist/server.js --smoke --project=/path/to/your/project   # optional sanity check
```

## Configure

All settings come from CLI flags or env vars (flags win):

| Flag | Env var | Default | Meaning |
|---|---|---|---|
| `--project=` | `GAMEDEV_PROJECT_ROOT` | current dir | The **only** folder the server may read/write. |
| `--engine=` | `GAMEDEV_ENGINE` | `auto` | `unity`, `unreal`, or `auto` (detect from markers). |
| `--lmstudio=` | `LMSTUDIO_BASE_URL` | `http://localhost:1234/v1` | OpenAI-compatible base URL (LM Studio, or a LiteLLM proxy in front of it). |
| `--api-key=` | `LMSTUDIO_API_KEY` | — | Bearer token if your endpoint needs one (LM Studio doesn't). |

Ready-to-edit MCP configs are in [`config-examples/`](config-examples/):
- [`lmstudio-mcp.json`](config-examples/lmstudio-mcp.json) — paste into LM Studio's `mcp.json`.
- [`claude-code.mcp.json`](config-examples/claude-code.mcp.json) — drop as `.mcp.json` in your game project root.

## Wiring LM Studio (MCP host)

1. Update LM Studio to **0.3.17 or newer**.
2. **Developer** tab → load a tool-calling model → **Start Server** (default port 1234).
3. Open **`mcp.json`** (the plug icon in chat, or the app data folder) and paste the block from
   [`config-examples/lmstudio-mcp.json`](config-examples/lmstudio-mcp.json), fixing the two absolute paths.
4. Start a chat — the model can now call `check_local_llm`, `scaffold`, `gdd_update`, etc.

> Use `check_local_llm` first — if it can't reach the endpoint, the model, not the tools, is the problem.

## Add the engine's own MCP (for live editor control)

This server intentionally does **not** re-implement editor control. Pair it with:

- **Unity — recommended.** More mature MCP support today. Install
  [CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp) *or* Unity's official MCP Server
  (**Edit → Project Settings → AI → Unity MCP**). Broad tools: scenes, GameObjects, components,
  scripts, tests, builds.
- **Unreal.** UE **5.8** ships an official (experimental) MCP plugin — enable it in **Plugins**, then
  register the toolsets it needs. Third-party servers (e.g.
  [ChiR24/Unreal_mcp](https://github.com/ChiR24/Unreal_mcp)) have broader tool surfaces but are rougher.

You end up with **two** MCP servers registered in your client: the engine's (editor control) and this
one (scaffolding + project knowledge).

## Tools

| Tool | What it does |
|---|---|
| `check_local_llm` | Pings the OpenAI-compatible endpoint and lists served models. Confirms the stack is live. |
| `detect_engine` | Reports Unity/Unreal and the evidence used. |
| `project_summary` | Engine + top-level folders + source-file counts. Good first call. |
| `list_scripts` | Lists source files (Unity `.cs`; Unreal `.h/.cpp/.cs`), optional substring filter. |
| `read_file` | Reads a text file **inside the project only** (traversal blocked). |
| `write_file` | Creates/overwrites a text file **inside the project only**. |
| `scaffold` | Engine-idiomatic boilerplate. Unity: `monobehaviour`, `scriptableobject`, `editor_window`, `test`. Unreal: `actor`, `actor_component`, `uobject`, `subsystem`. |
| `gdd_read` / `gdd_update` | Reads / appends-or-replaces `GameDesignDoc.md` — persistent design memory across sessions. |

**Safety:** every file path is resolved against the project root; anything that escapes it (`../`,
absolute paths) is rejected. The server can only ever touch the folder you point it at.

## Choosing a model for a 32 GB RTX 5090 + 64 GB RAM

Two things matter most for this workflow: **(1) strong coding ability** and **(2) reliable
tool/function calling** — MCP is worthless if the model can't emit clean tool calls.

**Fits fully in 32 GB VRAM (fast — keep everything on-GPU):**
- A **~30–34B coding model at Q4_K_M** (weights ≈ 18–21 GB, leaving room for a large context). This is
  the sweet spot for your card — e.g. the **Qwen2.5-Coder-32B-Instruct** family and its successors are
  excellent coders with solid tool-calling. Bump to Q5/Q6 if you want more fidelity and shorter context.
- **Devstral / Codestral (~22–24B)** — agentic-coding focused, good tool use, comfortable headroom.
- **`gpt-oss-20b`** — fast, strong tool-calling, lots of spare VRAM for big context.

**Bigger, using the 64 GB system RAM (partial CPU offload — slower but more capable):**
- A **70B-class model at Q4** won't fit in 32 GB alone; LM Studio can offload the overflow to RAM. Expect
  a real speed hit but higher quality for hard reasoning.

**Practical tips**
- In LM Studio, prefer models tagged for **tool use / function calling**; verify with `check_local_llm`
  and a trivial tool call before committing to one.
- Start with a coder in the **~20–32B** range fully on the GPU; only reach for 70B when a task clearly
  needs it. Model names move fast — search LM Studio's catalog for the current best coder in that size
  and pick a **Q4_K_M** or **Q5_K_M** GGUF.
- Give the model a generous context window (many coder models support 32k–128k) — MCP tool results and
  project files eat context quickly.

## Development

```bash
npm run build     # tsc → dist/
npm run smoke     # dist/server.js --smoke : prints registered tools + a scaffold sample
```

The server speaks MCP over **stdio** (newline-delimited JSON-RPC 2.0). `stdout` is the protocol channel;
all logs go to `stderr`.
