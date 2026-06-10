import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { ResponsesInput } from './input';
import { ResponsesOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';
import { litellmError } from '../errorHandling';

type RawOutputItem = {
	type?: string;
	role?: string;
	content?: Array<{ type?: string; text?: string }>;
};

type RawResponses = {
	id?: string;
	model: string;
	status?: string;
	output_text?: string;
	output?: RawOutputItem[];
	usage?: Record<string, number>;
};

/**
 * Pull the assistant's plain text out of a Responses-API payload: prefer the
 * convenience `output_text` when present, otherwise concatenate the text parts
 * of any message items. Saves workflows a parse step.
 */
function extractText(body: RawResponses): string {
	if (typeof body.output_text === 'string' && body.output_text.length > 0) {
		return body.output_text;
	}
	const parts: string[] = [];
	for (const item of body.output ?? []) {
		if (item.type === 'message' || item.role === 'assistant') {
			for (const c of item.content ?? []) {
				if (typeof c.text === 'string') parts.push(c.text);
			}
		}
	}
	return parts.join('');
}

export const responsesHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	ResponsesInput,
	ResponsesOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.post('/v1/responses')
			.handleRequest((ctx, input, request) =>
				request.withBodyAsJson({
					model: input.model,
					input: input.input,
					...(input.instructions
						? { instructions: input.instructions }
						: {}),
					...(input.max_output_tokens !== undefined
						? { max_output_tokens: input.max_output_tokens }
						: {}),
					...(input.temperature !== undefined
						? { temperature: input.temperature }
						: {}),
				})
			)
			.handleResponse((ctx, input, response) =>
				response.withErrorHandling(litellmError(response.getStatusCode())).parseWithBodyAsJson((body: RawResponses) =>
					OperationHandlerResult.success({
						text: extractText(body),
						status: body.status ?? '',
						output: (body.output ?? []) as object[],
						model: body.model,
						usage: (body.usage ?? {}) as object,
						id: body.id,
					})
				)
			)
	)
);
