import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { TextToSpeechInput } from './input';
import { TextToSpeechOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';

export const textToSpeechHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	TextToSpeechInput,
	TextToSpeechOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.post('/v1/audio/speech')
			.handleRequest((ctx, input, request) =>
				request.withBodyAsJson({
					model: input.model,
					input: input.input,
					voice: input.voice,
					...(input.response_format
						? { response_format: input.response_format }
						: {}),
					...(input.speed !== undefined ? { speed: input.speed } : {}),
				})
			)
			// The endpoint streams back raw audio bytes — capture them as a file.
			.handleResponse((ctx, input, response) =>
				response.parseWithBodyAsFile<TextToSpeechOutput['file']>((file) =>
					OperationHandlerResult.success({ file })
				)
			)
	)
);
