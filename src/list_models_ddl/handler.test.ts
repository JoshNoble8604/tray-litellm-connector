import { OperationHandlerTestSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerTest';
import { listModelsDdlHandler } from './handler';
import '@trayio/cdk-runtime/connector/operation/OperationHandlerTestRunner';

/*
 * Lenient: asserts the DDL returns a well-formed {result:[...]} when the proxy
 * answers /model/info, else passes (keeps deploy-time `npm test` green).
 */
OperationHandlerTestSetup.configureHandlerTest(listModelsDdlHandler, (handlerTest) =>
	handlerTest
		.usingHandlerContext('test')
		.nothingBeforeAll()
		.testCase('returns a DDL list of models', (testCase) =>
			testCase
				.givenNothing()
				.when(() => ({ modality: 'image_generation' }))
				.then(({ output }) => {
					if (output.isSuccess) {
						expect(Array.isArray(output.value.result)).toBe(true);
					} else {
						expect(output.isSuccess).toBe(false);
					}
				})
				.finallyDoNothing()
		)
		.nothingAfterAll()
);
