import { OperationHandlerTestSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerTest';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { chatCompletionHandler } from './handler';
import '@trayio/cdk-runtime/connector/operation/OperationHandlerTestRunner';

OperationHandlerTestSetup.configureHandlerTest(
	chatCompletionHandler,
	(handlerTest) =>
		handlerTest
			.usingHandlerContext('test')
			.nothingBeforeAll()
			.testCase('returns reply text from the proxy', (testCase) =>
				testCase
					.givenNothing()
					.when(() => ({
						model: 'local',
						user_prompt: 'Reply with exactly: PROXY OK',
						max_tokens: 50,
					}))
					.then(({ output }) => {
						const value =
							OperationHandlerResult.getSuccessfulValueOrFail(output);
						expect(typeof value.text).toBe('string');
						expect(value.text.length).toBeGreaterThan(0);
					})
					.finallyDoNothing()
			)
			.nothingAfterAll()
);
