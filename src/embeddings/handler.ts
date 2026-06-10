import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { EmbeddingsInput } from './input';
import { EmbeddingsOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';
import { litellmError } from '../errorHandling';

type RawEmbeddings = {
	data: Array<{ embedding: number[] }>;
	model: string;
	usage: { prompt_tokens: number; total_tokens: number };
};

export const embeddingsHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	EmbeddingsInput,
	EmbeddingsOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.post('/v1/embeddings')
			.handleRequest((ctx, input, request) =>
				request.withBodyAsJson({ model: input.model, input: input.input })
			)
			.handleResponse((ctx, input, response) =>
				response.withErrorHandling(litellmError(response.getStatusCode())).parseWithBodyAsJson((body: RawEmbeddings) =>
					OperationHandlerResult.success({
						embedding: body.data?.[0]?.embedding ?? [],
						model: body.model,
						usage: body.usage,
					})
				)
			)
	)
);
