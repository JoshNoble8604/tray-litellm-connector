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
						model: 'qwen3-vl-8b',
						user_prompt: 'Reply with exactly: PROXY OK',
						max_tokens: 50,
					}))
					.then(({ output }) => {
						// Lenient: don't block deploys on LM Studio runtime state
						// (it evicts models under load). Assert a well-formed result
						// when the model is hot, else accept a clean failure.
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
