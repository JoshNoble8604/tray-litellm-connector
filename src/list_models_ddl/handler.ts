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
 * filters by LiteLLM `mode` (so an image field only lists image models, etc.),
 * and falls back to ALL models when the proxy doesn't tag the requested
 * modality — so the dropdown is never empty on a customer gateway that lacks
 * model_info. The `*` wildcard route is excluded (it isn't a real model).
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
						names =
							matched.length > 0 ? matched : entries.map((m) => m.model_name);
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
