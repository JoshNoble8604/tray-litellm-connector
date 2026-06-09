import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { ChatCompletionInput } from './input';
import { ChatCompletionOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';

type RawToolCall = {
	id: string;
	type: string;
	function: { name: string; arguments: string };
};

type RawMessage = {
	role?: string;
	content: string | null;
	tool_calls?: RawToolCall[];
};

type RawChatCompletion = {
	choices: Array<{
		message: RawMessage;
		finish_reason: string;
	}>;
	model: string;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
};

/**
 * Best-effort parse of an LLM reply into JSON: trims, strips ```json fences,
 * and falls back to extracting the first {...}/[...] block. Returns undefined
 * if the reply isn't JSON. Lets workflows skip a separate parse script.
 */
function tryParseJson(s: string): object | undefined {
	if (!s) return undefined;
	let t = s.trim();
	const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	if (fence) t = fence[1].trim();
	try {
		return JSON.parse(t) as object;
	} catch (e) {
		/* not direct JSON */
	}
	const block = t.match(/[[{][\s\S]*[\]}]/);
	if (block) {
		try {
			return JSON.parse(block[0]) as object;
		} catch (e) {
			/* not parseable */
		}
	}
	return undefined;
}

export const chatCompletionHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	ChatCompletionInput,
	ChatCompletionOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.post('/v1/chat/completions')
			.handleRequest((ctx, input, request) => {
				const messages =
					input.messages && input.messages.length > 0
						? input.messages
						: [
								...(input.system_prompt
									? [{ role: 'system', content: input.system_prompt }]
									: []),
								{ role: 'user', content: input.user_prompt ?? '' },
						  ];

				return request.withBodyAsJson({
					model: input.model,
					messages: messages as any,
					...(input.temperature !== undefined
						? { temperature: input.temperature }
						: {}),
					...(input.max_tokens !== undefined
						? { max_tokens: input.max_tokens }
						: {}),
					...(input.response_format
						? { response_format: input.response_format as any }
						: input.json_response
						? { response_format: { type: 'json_object' } }
						: {}),
					...(input.tools && input.tools.length > 0
						? { tools: input.tools as any }
						: {}),
					...(input.tools && input.tools.length > 0 && input.tool_choice
						? { tool_choice: input.tool_choice as any }
						: {}),
				});
			})
			.handleResponse((ctx, input, response) =>
				response.parseWithBodyAsJson((body: RawChatCompletion) => {
					const choice = body.choices && body.choices[0];
					const msg = choice?.message;
					const content = msg?.content ?? '';
					return OperationHandlerResult.success({
						text: content,
						json: tryParseJson(content),
						finish_reason: choice?.finish_reason ?? '',
						model: body.model,
						usage: body.usage,
						message: (msg ?? {}) as object,
						tool_calls: (msg?.tool_calls ?? []) as object[],
					});
				})
			)
	)
);
