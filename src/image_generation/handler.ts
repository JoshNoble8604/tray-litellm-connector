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
			.handleRequest((ctx, input, request) => {
				// Assemble the LoRA stack from the fixed slots (LoRA 1..4 each have a
				// working dropdown via list_loras_ddl). Only populated slots are sent.
				const loras = [
					{ name: input.lora_1, strength: input.lora_1_strength },
					{ name: input.lora_2, strength: input.lora_2_strength },
					{ name: input.lora_3, strength: input.lora_3_strength },
					{ name: input.lora_4, strength: input.lora_4_strength },
				]
					.filter((l) => l.name)
					.map((l) => ({
						name: l.name as string,
						strength: l.strength ?? 1.0,
					}));
				return request.withBodyAsJson({
					model: input.model,
					prompt: input.prompt,
					...(input.n !== undefined ? { n: input.n } : {}),
					...(input.negative_prompt
						? { negative_prompt: input.negative_prompt }
						: {}),
					...(input.size ? { size: input.size } : {}),
					...(input.steps !== undefined ? { steps: input.steps } : {}),
					...(input.cfg !== undefined ? { cfg: input.cfg } : {}),
					...(input.seed !== undefined ? { seed: input.seed } : {}),
					...(loras.length > 0 ? { loras } : {}),
					...(input.quality ? { quality: input.quality } : {}),
					...(input.style ? { style: input.style } : {}),
					...(input.response_format
						? { response_format: input.response_format }
						: {}),
					...(input.keep_warm !== undefined
						? { keep_warm: input.keep_warm }
						: {}),
				});
			})
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
