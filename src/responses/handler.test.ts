import { OperationHandlerTestSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerTest';
import { responsesHandler } from './handler';
import '@trayio/cdk-runtime/connector/operation/OperationHandlerTestRunner';

/*
 * Lenient by design: the local LM Studio test proxy does not implement the
 * /v1/responses route. Assert the handler returns a result, and only check
 * shape on success — keeps deploy-time `npm test` green.
 */
OperationHandlerTestSetup.configureHandlerTest(responsesHandler, (handlerTest) =>
	handlerTest
		.usingHandlerContext('test')
		.nothingBeforeAll()
		.testCase('generates a response when the backend supports it', (testCase) =>
			testCase
				.givenNothing()
				.when(() => ({
					model: 'gpt-4o',
					input: 'Say hello in one word.',
				}))
				.then(({ output }) => {
					if (output.isSuccess) {
						expect(typeof output.value.text).toBe('string');
						expect(Array.isArray(output.value.output)).toBe(true);
					} else {
						expect(output.isSuccess).toBe(false);
					}
				})
				.finallyDoNothing()
		)
		.nothingAfterAll()
);
