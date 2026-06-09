import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { RerankInput } from './input';
import { RerankOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';

type RawRerankResult = {
	index: number;
	relevance_score: number;
	document?: string | { text: string };
};

type RawRerank = {
	results: RawRerankResult[];
	model?: string;
};

export const rerankHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	RerankInput,
	RerankOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.post('/v1/rerank')
			.handleRequest((ctx, input, request) =>
				request.withBodyAsJson({
					model: input.model,
					query: input.query,
					documents: input.documents,
					...(input.top_n !== undefined ? { top_n: input.top_n } : {}),
					...(input.return_documents !== undefined
						? { return_documents: input.return_documents }
						: {}),
				})
			)
			.handleResponse((ctx, input, response) =>
				response.parseWithBodyAsJson((body: RawRerank) => {
					const results = body.results ?? [];
					// Results come back sorted most-relevant first; map each back to
					// the original document text via its index so workflows get a
					// ready-to-use reordered list with no extra sort step.
					const ranked = results
						.map((r) => input.documents[r.index])
						.filter((d): d is string => d !== undefined);
					const top = results[0];
					return OperationHandlerResult.success({
						top_document:
							top !== undefined ? input.documents[top.index] : undefined,
						top_score: top?.relevance_score,
						ranked_documents: ranked,
						results: results as object[],
						model: body.model,
					});
				})
			)
	)
);
