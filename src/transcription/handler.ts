import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { TranscriptionInput } from './input';
import { TranscriptionOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';
import { litellmError } from '../errorHandling';

type RawTranscription = {
	text: string;
	language?: string;
	duration?: number;
	segments?: Array<Record<string, string | number | boolean>>;
};

export const transcriptionHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	TranscriptionInput,
	TranscriptionOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.post('/v1/audio/transcriptions')
			.handleRequest((ctx, input, request) =>
				// Whisper-style endpoints take multipart/form-data: the audio goes in
				// `files`, everything else as string `fields`.
				request.withBodyAsMultipart({
					fields: {
						model: input.model,
						...(input.language ? { language: input.language } : {}),
						...(input.prompt ? { prompt: input.prompt } : {}),
						...(input.temperature !== undefined
							? { temperature: String(input.temperature) }
							: {}),
						...(input.response_format
							? { response_format: input.response_format }
							: {}),
					},
					files: { file: input.file },
				})
			)
			.handleResponse((ctx, input, response) =>
				response.withErrorHandling(litellmError(response.getStatusCode())).parseWithBodyAsJson((body: RawTranscription) =>
					OperationHandlerResult.success({
						text: body.text ?? '',
						language: body.language,
						duration: body.duration,
						segments: body.segments ?? [],
						raw: body as object,
					})
				)
			)
	)
);
