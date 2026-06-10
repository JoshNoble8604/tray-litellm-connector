import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { RedactPiiInput } from './input';
import { RedactPiiOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';
import { litellmError } from '../errorHandling';

type RawRedact = {
	masked_text: string;
	entities: Array<{ type: string; start: number; end: number; score: number }>;
	count: number;
};

/**
 * PII/PHI redaction. POSTs to the proxy's `/redact` route, which LiteLLM
 * pass-through-forwards to a local Microsoft Presidio service (deterministic
 * entity detection — NOT an LLM; the text is not sent to any model). Goes
 * through the proxy so it uses the same auth + logging as the other ops.
 */
export const redactPiiHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	RedactPiiInput,
	RedactPiiOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.post('/redact')
			.handleRequest((ctx, input, request) =>
				request.withBodyAsJson({
					text: input.text,
					...(input.language ? { language: input.language } : {}),
				})
			)
			.handleResponse((ctx, input, response) =>
				response.withErrorHandling(litellmError(response.getStatusCode())).parseWithBodyAsJson((body: RawRedact) =>
					OperationHandlerResult.success({
						masked_text: body.masked_text ?? '',
						entities: (body.entities ?? []) as object[],
						count: body.count ?? 0,
					})
				)
			)
	)
);
