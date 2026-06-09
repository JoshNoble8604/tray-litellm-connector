import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { CompletionsInput } from './input';
import { CompletionsOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';

type RawCompletions = {
	choices: Array<{
		text: string;
		finish_reason: string;
	}>;
	model: string;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
};

export const completionsHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	CompletionsInput,
	CompletionsOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.post('/v1/completions')
			.handleRequest((ctx, input, request) =>
				request.withBodyAsJson({
					model: input.model,
					prompt: input.prompt,
					...(input.max_tokens !== undefined
						? { max_tokens: input.max_tokens }
						: {}),
					...(input.temperature !== undefined
						? { temperature: input.temperature }
						: {}),
					...(input.stop && input.stop.length > 0
						? { stop: input.stop }
						: {}),
				})
			)
			.handleResponse((ctx, input, response) =>
				response.parseWithBodyAsJson((body: RawCompletions) => {
					const choice = body.choices && body.choices[0];
					return OperationHandlerResult.success({
						text: choice?.text ?? '',
						finish_reason: choice?.finish_reason ?? '',
						model: body.model,
						usage: body.usage,
					});
				})
			)
	)
);
