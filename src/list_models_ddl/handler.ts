import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { ListModelsDdlInput } from './input';
import { ListModelsDdlOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';

type RawModelInfo = {
	data: Array<{
		model_name: string;
		model_info?: { mode?: string | null } | null;
	}>;
};

/**
 * Backs the dynamic model dropdowns. Calls the proxy's /model/info, optionally
 * filters by LiteLLM `mode` (so an image field only lists image models, etc.).
 * Fallback: if the proxy tags NO modality at all, return all models (so the
 * dropdown is never empty on a gateway without model_info); but if the proxy
 * DOES tag modality and simply has none of the requested type, return empty
 * (don't mislead with unrelated models). The `*` wildcard route is excluded.
 */
export const listModelsDdlHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	ListModelsDdlInput,
	ListModelsDdlOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.get('/model/info')
			.handleRequest((ctx, input, request) => request.withoutBody())
			.handleResponse((ctx, input, response) =>
				response.parseWithBodyAsJson((body: RawModelInfo) => {
					const entries = (body.data ?? []).filter(
						(m) => m.model_name && m.model_name !== '*'
					);
					let names: string[];
					if (input.modality) {
						const matched = entries
							.filter((m) => m.model_info?.mode === input.modality)
							.map((m) => m.model_name);
						const proxyTagsModality = entries.some((m) => m.model_info?.mode);
						if (matched.length > 0) {
							// Models of this modality exist — show exactly those.
							names = matched;
						} else if (!proxyTagsModality) {
							// Proxy doesn't tag modality at all → show everything so the
							// dropdown is never empty on an untagged gateway.
							names = entries.map((m) => m.model_name);
						} else {
							// Proxy tags modality but has none of this type → genuinely none.
							names = [];
						}
					} else {
						names = entries.map((m) => m.model_name);
					}
					const unique = Array.from(new Set(names)).sort();
					return OperationHandlerResult.success({
						result: unique.map((n) => ({ text: n, value: n })),
					});
				})
			)
	)
);
