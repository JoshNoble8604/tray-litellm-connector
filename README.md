# LiteLLM Tray Connector

A custom [Tray](https://tray.io) connector (built with the Tray Connector Development Kit) that calls **any LLM through a [LiteLLM](https://docs.litellm.ai) proxy** — an OpenAI-compatible AI gateway. It turns the usual *build-request → HTTP-client → parse-JSON* script trio into a single business-friendly form step.

Because it speaks the standard OpenAI-compatible LiteLLM API, it works against **any** LiteLLM deployment (self-hosted, hosted, or Enterprise) and is agnostic to whatever models/providers sit behind the gateway (OpenAI, Anthropic, Bedrock, local models, etc.).

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

> The auth shape is defined in code in [`src/LitellmAuth.ts`](src/LitellmAuth.ts) — `TokenOperationHandlerAuth` with **user** fields `endpoint` + `api_key` and an empty app type. The Service's property keys must mirror those exactly.

## Authentication (what end users enter)

When a builder adds the connector and creates a **New authentication**, they fill in just these two fields:

| Field (in Tray) | Maps to Service property | Value |
|---|---|---|
| **Endpoint URL** | `endpoint` | Base URL of the LiteLLM proxy — **no trailing slash, no `/v1`** (the connector adds the path). e.g. `https://litellm.example.com` |
| **API Key** | `api_key` | A LiteLLM key (virtual or master). Sent as `Authorization: Bearer <key>`. |

No client/app credentials are required — it's a single user-supplied token auth.

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

**Utility**
- `list_models` — list models the connected proxy exposes (`/v1/models`)
- `health_check` — proxy liveliness (`/health/liveliness`)
- `warm_model` — JIT-load a model on self-hosted backends

Every model field is a **dynamic dropdown** that lists the models on *your* connected proxy, filtered by modality (via the proxy's `/model/info`), with a graceful fallback to all models when the proxy doesn't tag modality.

> Note: which operations return data depends on your gateway's configuration — e.g. `rerank`/`moderation`/`image`/audio require the proxy to have a backend for that modality. The connector builds the correct request regardless; missing backends surface as clean relayed errors.

## Develop

```bash
npm install
npm run compile        # tsc + copy schema json
npm test               # runs against the proxy in src/test.ctx.json
```

To run the tests, copy `src/test.ctx.example.json` → `src/test.ctx.json` and fill in **your own** proxy endpoint + key. `src/test.ctx.json` is **gitignored**, so the key you put there stays on your machine and is never committed. The repository contains only the placeholder example — no real keys.

## Deploy

```bash
export TRAY_API_BASE_URL=https://api.tray.io
export TRAY_API_TOKEN=<your Tray workspace token>
tray-cdk deployment create --us            # --us | --eu | --ap | --ap2
tray-cdk deployment get tray-litellm 1.0 <deployment-id> --us
tray-cdk permissions add tray-litellm 1.0 --email=<teammate@example.com> --us
```

Requires the Tray **Service** from [Set up the Tray Service](#set-up-the-tray-service-one-time-before-deploying) above, with its Unique Service Name set in `connector.json`.
