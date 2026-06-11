import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { ListLorasDdlInput } from './input';
import { ListLorasDdlOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';
import { litellmError } from '../errorHandling';

type RawLoras = { loras?: string[] };

/**
 * Backs the LoRA dropdown on the image step. Calls the gateway's /loras route
 * (local SDXL/ComfyUI gateways expose it), returning the available LoRA files.
 * The display text strips the ".safetensors" extension; the value is the full
 * filename the gateway expects.
 */
export const listLorasDdlHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	ListLorasDdlInput,
	ListLorasDdlOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.get('/loras')
			.handleRequest((ctx, input, request) => request.withoutBody())
			.handleResponse((ctx, input, response) =>
				response
					.withErrorHandling(litellmError(response.getStatusCode()))
					.parseWithBodyAsJson((body: RawLoras) => {
						const loras = Array.from(new Set(body.loras ?? [])).sort();
						return OperationHandlerResult.success({
							result: loras.map((n) => ({
								text: n.replace(/\.safetensors$/i, ''),
								value: n,
							})),
						});
					})
			)
	)
);
