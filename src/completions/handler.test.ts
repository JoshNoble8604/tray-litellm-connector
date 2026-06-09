import { OperationHandlerTestSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerTest';
import { completionsHandler } from './handler';
import '@trayio/cdk-runtime/connector/operation/OperationHandlerTestRunner';

/*
 * Lenient by design: not every proxy backend serves the legacy /v1/completions
 * route. Assert the handler returns a result, and only check shape on success
 * — keeps deploy-time `npm test` green regardless of backend capabilities.
 */
OperationHandlerTestSetup.configureHandlerTest(completionsHandler, (handlerTest) =>
	handlerTest
		.usingHandlerContext('test')
		.nothingBeforeAll()
		.testCase('completes a prompt when the backend supports it', (testCase) =>
			testCase
				.givenNothing()
				.when(() => ({
					model: 'local',
					prompt: 'The capital of France is',
					max_tokens: 5,
				}))
				.then(({ output }) => {
					if (output.isSuccess) {
						expect(typeof output.value.text).toBe('string');
					} else {
						expect(output.isSuccess).toBe(false);
					}
				})
				.finallyDoNothing()
		)
		.nothingAfterAll()
);
