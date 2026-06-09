import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { ModerationInput } from './input';
import { ModerationOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';

type RawModerationResult = {
	flagged: boolean;
	categories: Record<string, boolean>;
	category_scores: Record<string, number>;
};

type RawModeration = {
	model: string;
	results: RawModerationResult[];
};

export const moderationHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	ModerationInput,
	ModerationOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.post('/v1/moderations')
			.handleRequest((ctx, input, request) =>
				request.withBodyAsJson({
					input: input.input,
					...(input.model ? { model: input.model } : {}),
				})
			)
			.handleResponse((ctx, input, response) =>
				response.parseWithBodyAsJson((body: RawModeration) => {
					const first = body.results && body.results[0];
					return OperationHandlerResult.success({
						flagged: first?.flagged ?? false,
						categories: first?.categories ?? {},
						category_scores: first?.category_scores ?? {},
						results: (body.results ?? []) as object[],
						model: body.model,
					});
				})
			)
	)
);
