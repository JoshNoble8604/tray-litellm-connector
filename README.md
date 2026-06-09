# LiteLLM Tray Connector

A custom [Tray](https://tray.io) connector (built with the Tray Connector Development Kit) that calls **any LLM through a [LiteLLM](https://docs.litellm.ai) proxy** — an OpenAI-compatible AI gateway. It turns the usual *build-request → HTTP-client → parse-JSON* script trio into a single business-friendly form step.

Because it speaks the standard OpenAI-compatible LiteLLM API, it works against **any** LiteLLM deployment (self-hosted, hosted, or Enterprise) and is agnostic to whatever models/providers sit behind the gateway (OpenAI, Anthropic, Bedrock, local models, etc.).

## Authentication

Token auth — two fields:

| Field | Description |
|---|---|
| **Endpoint URL** | Base URL of your LiteLLM proxy, **no trailing slash and no `/v1`** (the connector adds paths). e.g. `https://litellm.example.com` |
| **API Key** | A LiteLLM key (virtual or master), sent as `Authorization: Bearer <key>`. |

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

Copy `src/test.ctx.example.json` → `src/test.ctx.json` and fill in your proxy endpoint + key (this file is gitignored — it holds a real key).

## Deploy

```bash
export TRAY_API_BASE_URL=https://api.tray.io
export TRAY_API_TOKEN=<your Tray workspace token>
tray-cdk deployment create --us            # --us | --eu | --ap | --ap2
tray-cdk deployment get tray-litellm 1.0 <deployment-id> --us
tray-cdk permissions add tray-litellm 1.0 --email=<teammate@example.com> --us
```

Requires a Tray **Service** whose custom Token-auth property keys exactly match the connector's auth fields (`endpoint`, `api_key`).
