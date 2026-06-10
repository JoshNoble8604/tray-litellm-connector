import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { ImageGenerationInput } from './input';
import { ImageGenerationOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';
import { litellmError } from '../errorHandling';

type RawImage = {
	url?: string;
	b64_json?: string;
	revised_prompt?: string;
};

type RawImageGeneration = {
	created?: number;
	data: RawImage[];
};

export const imageGenerationHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	ImageGenerationInput,
	ImageGenerationOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.post('/v1/images/generations')
			.handleRequest((ctx, input, request) =>
				request.withBodyAsJson({
					model: input.model,
					prompt: input.prompt,
					...(input.n !== undefined ? { n: input.n } : {}),
					...(input.size ? { size: input.size } : {}),
					...(input.quality ? { quality: input.quality } : {}),
					...(input.style ? { style: input.style } : {}),
					...(input.response_format
						? { response_format: input.response_format }
						: {}),
				})
			)
			.handleResponse((ctx, input, response) =>
				response.withErrorHandling(litellmError(response.getStatusCode())).parseWithBodyAsJson((body: RawImageGeneration) => {
					const data = body.data ?? [];
					const first = data[0];
					return OperationHandlerResult.success({
						url: first?.url,
						b64_json: first?.b64_json,
						revised_prompt: first?.revised_prompt,
						images: data as object[],
						created: body.created,
					});
				})
			)
	)
);
