import {
	OperationHandlerResult,
	OperationHandlerError,
} from '@trayio/cdk-dsl/connector/operation/OperationHandler';

/**
 * Shared error handler for every LiteLLM operation. On a non-2xx response the CDK's
 * default behaviour is a useless "API returned a status code of N" — this instead
 * surfaces the proxy's ACTUAL error so it shows up in the Tray step output.
 *
 * LiteLLM / OpenAI-style errors look like {"error":{"message":"...","code":"..."}};
 * LM Studio and the local shims sometimes return a bare string or {"detail":"..."}.
 * We parse defensively and always include the raw body + status so nothing is hidden.
 *
 * Usage in a handler's response chain (BEFORE the parse call):
 *   response
 *     .withErrorHandling(litellmError(response.getStatusCode()))
 *     .parseWithBodyAsJson((body) => OperationHandlerResult.success({ ... }))
 */
export function litellmError(statusCode: number) {
	// Result type is `never` (a failure carries no success value), which is assignable
	// to every operation's OUT — so call sites don't need to name their output type.
	return (text: string): OperationHandlerResult<never> => {
		let message = text;
		try {
			const j = JSON.parse(text);
			message =
				j?.error?.message ??
				j?.error ??
				j?.message ??
				j?.detail ??
				text;
			if (typeof message !== 'string') message = JSON.stringify(message);
		} catch (e) {
			/* body wasn't JSON — keep the raw text */
		}
		return OperationHandlerResult.failure<never>(
			OperationHandlerError.apiError(
				`LiteLLM proxy error (HTTP ${statusCode}): ${message}`,
				{ status_code: statusCode, body: text }
			)
		);
	};
}
