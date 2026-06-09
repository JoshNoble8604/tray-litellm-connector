import { OperationHandlerTestSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerTest';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { listModelsHandler } from './handler';
import '@trayio/cdk-runtime/connector/operation/OperationHandlerTestRunner';

OperationHandlerTestSetup.configureHandlerTest(listModelsHandler, (handlerTest) =>
	handlerTest
		.usingHandlerContext('test')
		.nothingBeforeAll()
		.testCase('lists available models', (testCase) =>
			testCase
				.givenNothing()
				.when(() => ({}))
				.then(({ output }) => {
					const value = OperationHandlerResult.getSuccessfulValueOrFail(output);
					expect(Array.isArray(value.models)).toBe(true);
					expect(value.count).toBeGreaterThan(0);
				})
				.finallyDoNothing()
		)
		.nothingAfterAll()
);
