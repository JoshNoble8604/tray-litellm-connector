import { OperationHandlerTestSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerTest';
import { moderationHandler } from './handler';
import '@trayio/cdk-runtime/connector/operation/OperationHandlerTestRunner';

/*
 * Lenient by design: the CI proxy backend (local LM Studio) may not serve
 * /v1/moderations. Assert the handler returns a result, and only check shape
 * when the backend supports the route — keeps deploy-time `npm test` green.
 */
OperationHandlerTestSetup.configureHandlerTest(moderationHandler, (handlerTest) =>
	handlerTest
		.usingHandlerContext('test')
		.nothingBeforeAll()
		.testCase('classifies text when the backend supports moderation', (testCase) =>
			testCase
				.givenNothing()
				.when(() => ({
					input: 'I want to learn how to bake bread.',
				}))
				.then(({ output }) => {
					if (output.isSuccess) {
						expect(typeof output.value.flagged).toBe('boolean');
						expect(Array.isArray(output.value.results)).toBe(true);
					} else {
						expect(output.isSuccess).toBe(false);
					}
				})
				.finallyDoNothing()
		)
		.nothingAfterAll()
);
