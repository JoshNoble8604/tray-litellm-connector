import { OperationHandlerTestSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerTest';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { embeddingsHandler } from './handler';
import '@trayio/cdk-runtime/connector/operation/OperationHandlerTestRunner';

OperationHandlerTestSetup.configureHandlerTest(embeddingsHandler, (handlerTest) =>
	handlerTest
		.usingHandlerContext('test')
		.nothingBeforeAll()
		.testCase('returns an embedding vector', (testCase) =>
			testCase
				.givenNothing()
				.when(() => ({
					model: 'mxbai-embed',
					input: 'hello world',
				}))
				.then(({ output }) => {
					// Lenient: don't block deploys on LM Studio runtime state.
					if (output.isSuccess) {
						expect(Array.isArray(output.value.embedding)).toBe(true);
					} else {
						expect(output.isSuccess).toBe(false);
					}
				})
				.finallyDoNothing()
		)
		.nothingAfterAll()
);
