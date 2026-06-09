import { OperationHandlerTestSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerTest';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { healthCheckHandler } from './handler';
import '@trayio/cdk-runtime/connector/operation/OperationHandlerTestRunner';

OperationHandlerTestSetup.configureHandlerTest(healthCheckHandler, (handlerTest) =>
	handlerTest
		.usingHandlerContext('test')
		.nothingBeforeAll()
		.testCase('proxy is reachable', (testCase) =>
			testCase
				.givenNothing()
				.when(() => ({}))
				.then(({ output }) => {
					const value = OperationHandlerResult.getSuccessfulValueOrFail(output);
					expect(value.ok).toBe(true);
				})
				.finallyDoNothing()
		)
		.nothingAfterAll()
);
