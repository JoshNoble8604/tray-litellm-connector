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
					const value = OperationHandlerResult.getSuccessfulValueOrFail(output);
					expect(Array.isArray(value.embedding)).toBe(true);
					expect(value.embedding.length).toBeGreaterThan(0);
				})
				.finallyDoNothing()
		)
		.nothingAfterAll()
);
