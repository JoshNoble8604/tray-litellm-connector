import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { WarmModelInput } from './input';
import { WarmModelOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';

export const warmModelHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	WarmModelInput,
	WarmModelOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.post('/v1/chat/completions')
			.handleRequest((ctx, input, request) =>
				request.withBodyAsJson({
					model: input.model,
					messages: [{ role: 'user', content: 'ping' }],
					max_tokens: 1,
				})
			)
			.handleResponse((ctx, input, response) =>
				response
					.withErrorHandling(() =>
						OperationHandlerResult.success({
							model: input.model,
							ready: false,
							status_code: response.getStatusCode(),
						})
					)
					.parseWithBodyAsJson(() =>
						OperationHandlerResult.success({
							model: input.model,
							ready: true,
							status_code: response.getStatusCode(),
						})
					)
			)
	)
);
