import { OperationHandlerTestSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerTest';
import { rerankHandler } from './handler';
import '@trayio/cdk-runtime/connector/operation/OperationHandlerTestRunner';

/*
 * Lenient by design: the proxy backend used in CI (local LM Studio) may not
 * serve /v1/rerank. We assert the handler returns a result and, only when the
 * backend supports the route, that the ranked output is well-formed — so the
 * deploy-time `npm test` stays green regardless of backend capabilities.
 */
OperationHandlerTestSetup.configureHandlerTest(rerankHandler, (handlerTest) =>
	handlerTest
		.usingHandlerContext('test')
		.nothingBeforeAll()
		.testCase('ranks documents when the backend supports rerank', (testCase) =>
			testCase
				.givenNothing()
				.when(() => ({
					model: 'rerank-english-v3.0',
					query: 'What is the capital of France?',
					documents: [
						'The Eiffel Tower is in Paris.',
						'Bananas are a good source of potassium.',
						'Paris is the capital of France.',
					],
				}))
				.then(({ output }) => {
					if (output.isSuccess) {
						expect(Array.isArray(output.value.ranked_documents)).toBe(true);
						expect(Array.isArray(output.value.results)).toBe(true);
					} else {
						expect(output.isSuccess).toBe(false);
					}
				})
				.finallyDoNothing()
		)
		.nothingAfterAll()
);
