# LiteLLM Tray Connector

A custom [Tray](https://tray.io) connector (built with the Tray Connector Development Kit) that calls **any LLM through a [LiteLLM](https://docs.litellm.ai) proxy** — an OpenAI-compatible AI gateway. It turns the usual *build-request → HTTP-client → parse-JSON* script trio into a single business-friendly form step.

Because it speaks the standard OpenAI-compatible LiteLLM API, it works against **any** LiteLLM deployment (self-hosted, hosted, or Enterprise) and is agnostic to whatever models/providers sit behind the gateway (OpenAI, Anthropic, Bedrock, local models, etc.).

## Prerequisites

- **Node.js 18+**
- **Tray CDK CLI** — `npm install -g @trayio/cdk-cli` (provides the `tray-cdk` command)
- A **Tray workspace with custom-connector (CDK) access** — deploying custom connectors is a gated capability; confirm with your Tray admin/CSM that CDK deploys are enabled for your org.
- A reachable **LiteLLM proxy** — the connector calls it. Stand one up with the [LiteLLM Docker quickstart](https://docs.litellm.ai/docs/proxy/docker_quick_start). It must be reachable **from Tray Cloud** — a public URL or tunnel, not `localhost`.

## Quick start

1. **Create the Tray Service** (see [below](#set-up-the-tray-service-one-time-before-deploying)) and copy its **Unique Service Name**.
2. Put that name in [`connector.json`](connector.json) → `service.name` (replace the placeholder committed here).
3. `npm install`
4. **Deploy:** `export TRAY_API_TOKEN=<your token>` then `tray-cdk deployment create --us`
5. **Share** with your Tray login email: `tray-cdk permissions add <connector-name> 1.0 --email=you@example.com --us` (use *your* renamed connector name, not `tray-litellm` — see step 2)
6. In the Tray builder: add the **LiteLLM** connector → **New authentication** (Name + endpoint + api_key) → drop any operation into a workflow.

Each step is detailed below.

## Set up the Tray Service (one-time, before deploying)

A Tray CDK connector binds to a **Service** that defines its authentication. You must create this Service in Tray **before** the first deploy, because `connector.json` references the Service's unique name.

1. In Tray, go to **Services → New service**.
2. Name it (e.g. `LiteLLM`).
3. Set **Authentication type** to **Token**.
4. Add two **custom authentication properties**, **user**-scoped, type **String**. The property **keys must match exactly** — the connector reads `ctx.auth.user.endpoint` and `ctx.auth.user.api_key`, so any mismatch causes `api_key: undefined` at runtime:

   | Property key (exact) | Type | Title shown to user | Required |
   |---|---|---|---|
   | `endpoint` | String | `Endpoint URL` | yes |
   | `api_key` | String | `API Key` | yes |

   There are **no app/secret (client) properties** — it's purely user-supplied.
5. Save. Tray generates a **Unique Service Name** (e.g. `pNRVyYfOXKbDLBK_litellm`).
6. Put that name into [`connector.json`](connector.json):

   ```json
   "service": { "name": "<your-unique-service-name>", "version": "1" }
   ```

> ⚠️ The `service.name` committed in this repo (`pNRVyYfOXKbDLBK_litellm`) is the original author's. You **must** replace it with your own Service's Unique Service Name — otherwise the deploy will try to bind to a service you don't own and fail.

> The auth shape is defined in code in [`src/LitellmAuth.ts`](src/LitellmAuth.ts) — `TokenOperationHandlerAuth` with **user** fields `endpoint` + `api_key` and an empty app type. The Service's property keys must mirror those exactly.

## Authentication (the New-authentication screen)

The screen has **three** fields:

| Field | Required | Used by connector | What to enter |
|---|---|---|---|
| **Name** | yes | No — just a label for the saved auth | e.g. `LiteLLM – Acme` |
| **Endpoint URL** (`endpoint`) | yes | Yes | Proxy base URL — **no trailing slash, no `/v1`** (e.g. `https://litellm.example.com`) |
| **API Key** (`api_key`) | yes (masked) | Yes | A LiteLLM key (virtual or master); sent as `Authorization: Bearer <key>` |

`Name` is Tray's standard auth-instance label — the connector never sees it. The other two field **labels come from the Service** (the titles you set when creating it); if you leave the Service titles as the raw keys, they appear as `endpoint` / `api_key`. If an **Environment** dropdown also appears, leave its default. No client/app credentials are required.

## Operations

**Inference**
- `chat_completion` — chat models, with optional tools/JSON mode (`/v1/chat/completions`)
- `completions` — legacy text completion (`/v1/completions`)
- `responses` — OpenAI Responses API (`/v1/responses`)
- `embeddings` — text → vector (`/v1/embeddings`)
- `rerank` — reorder documents by relevance to a query (`/v1/rerank`)
- `image_generation` — text → image (`/v1/images/generations`)
- `transcription` — audio file → text (`/v1/audio/transcriptions`)
- `text_to_speech` — text → audio file (`/v1/audio/speech`)
- `moderation` — content safety classification (`/v1/moderations`)

**Privacy**
- `redact_pii` — detect & mask **PII/PHI** in text (names, SSN, MRN, DOB, phone, email, addresses, member/policy IDs, …). Returns `masked_text` + detected `entities`. **Not an LLM** — deterministic entity detection. Takes a `text` input (no model). Requires a `/redact` route on your proxy (see note below).

**Utility**
- `list_models` — list models the connected proxy exposes (`/v1/models`)
- `health_check` — proxy liveliness (`/health/liveliness`)
- `warm_model` — JIT-load a model on self-hosted backends

> **`redact_pii` backend:** `/redact` is **not** a native LiteLLM route. The op POSTs to `/redact` on your proxy, which you wire to a PII engine — e.g. set LiteLLM `general_settings.pass_through_endpoints` to forward `/redact` to a local [Microsoft Presidio](https://microsoft.github.io/presidio/) analyzer + anonymizer (so it runs **through** the proxy, with the proxy's auth, and the text never goes to an LLM). Without that route configured, `redact_pii` returns an error.

Every model field is a **dynamic dropdown** that lists the models on *your* connected proxy, filtered by modality (via the proxy's `/model/info`), with a graceful fallback to all models when the proxy doesn't tag modality.

> Note: which operations return data depends on your gateway's configuration — e.g. `rerank`/`moderation`/`image`/audio require the proxy to have a backend for that modality. The connector builds the correct request regardless; missing backends surface as clean relayed errors.

## Develop

```bash
npm install
npm run compile        # tsc + copy schema json
npm test               # runs against the proxy in src/test.ctx.json
```

To run the tests, copy `src/test.ctx.example.json` → `src/test.ctx.json` and fill in **your own** proxy endpoint + key. `src/test.ctx.json` is **gitignored**, so the key you put there stays on your machine and is never committed. The repository contains only the placeholder example — no real keys.

## Connector name & namespace

CDK connectors deploy under your org's **connector namespace**, and the `name` in [`connector.json`](connector.json) **must be prefixed with that namespace**.

1. Find your namespace (or create one):

   ```bash
   tray-cdk namespace get <your-org-id> --us       # or: tray-cdk namespace create <your-org-id> --us
   ```
2. Set `connector.json` → `name` to `<namespace>-litellm`. This repo ships `tray-litellm` (namespace `tray`); if your namespace is e.g. `acme`, rename it to `acme-litellm` (keep `version` as-is, e.g. `1.0`).
3. Use that exact `<name> <version>` (e.g. `tray-litellm 1.0`) in **every** `tray-cdk` command and when sharing.

> If the `name` isn't prefixed with your org's namespace, the deploy is rejected.

## Deploy

```bash
export TRAY_API_BASE_URL=https://api.tray.io
export TRAY_API_TOKEN=<your Tray workspace token>
tray-cdk deployment create --us            # --us | --eu | --ap | --ap2
tray-cdk deployment get <connector-name> 1.0 <deployment-id> --us
tray-cdk permissions add <connector-name> 1.0 --email=<teammate@example.com> --us
```

- **`<connector-name>`** = the `name` in your `connector.json`. This repo ships `tray-litellm` (namespace `tray`), but **you must rename it to *your* org's namespace** (e.g. `acme-litellm`) — see [Connector name & namespace](#connector-name--namespace). Use that exact name in every command, not `tray-litellm`.
- `TRAY_API_TOKEN` — a Tray API token for your workspace (from your Tray account settings). Pass the **region flag** matching your Tray region (`--us`, `--eu`, `--ap`, `--ap2`).
- Deploy runs `npm test` first, so keep `src/test.ctx.json` pointed at a working proxy.
- Requires the Tray **Service** from [Set up the Tray Service](#set-up-the-tray-service-one-time-before-deploying) above, with its Unique Service Name in `connector.json`.

> **Sharing is by exact email.** A CDK connector is visible only to the **exact** email addresses on its share list, within the same org — so you must share it with the email each person logs into **that Tray instance** with. Sub-addressed emails count as a **different account**: `you+demo@company.com` ≠ `you@company.com`. A connector that "doesn't show up" in the builder is almost always this email/identity mismatch.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `api_key` / `endpoint` is `undefined` at runtime | The Service's auth property **keys** don't exactly match `endpoint` / `api_key` (case-sensitive). Re-check the Service properties. |
| Connector doesn't appear in the Tray builder | It's only visible to emails on its share list, in the same org. Run `tray-cdk permissions add <connector-name> 1.0 --email=<your exact Tray login email> --us`. |
| Deploy rejected / connector not found | The `connector.json` `name` isn't prefixed with **your** org's namespace. It must be `<your-namespace>-litellm`, not `tray-litellm` (this repo's default). Run `tray-cdk namespace get <org-id> --us` to find yours. |
| `Invalid model name … available models for your key` | Your LiteLLM **virtual key** isn't scoped to that model. Broaden it (`/key/update` with `models: ["all-proxy-models"]`) or use a key that includes it. |
| Model dropdown is empty or shows the wrong models | Same key-scoping as above — the dropdown lists only what your key can access (and filters by modality via `/model/info`). |
| An operation returns 404/500 | The proxy has no backend configured for that modality (e.g. no reranker, moderation, image, or audio model). The connector builds the request correctly; configure the model on your LiteLLM proxy. |
| Calls fail with connection/timeout from Tray | The proxy URL isn't reachable from Tray Cloud. Use a public URL or tunnel, not `localhost`. |
