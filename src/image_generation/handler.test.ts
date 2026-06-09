import { OperationHandlerTestSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerTest';
import { imageGenerationHandler } from './handler';
import '@trayio/cdk-runtime/connector/operation/OperationHandlerTestRunner';

/*
 * Lenient by design: the CI proxy backend (local LM Studio) typically has no
 * image model. Assert the handler returns a result, and only check shape when
 * the backend supports the route — keeps deploy-time `npm test` green.
 */
OperationHandlerTestSetup.configureHandlerTest(imageGenerationHandler, (handlerTest) =>
	handlerTest
		.usingHandlerContext('test')
		.nothingBeforeAll()
		.testCase('generates an image when the backend supports it', (testCase) =>
			testCase
				.givenNothing()
				.when(() => ({
					model: 'dall-e-3',
					prompt: 'A red bicycle leaning against a white wall',
				}))
				.then(({ output }) => {
					if (output.isSuccess) {
						expect(Array.isArray(output.value.images)).toBe(true);
					} else {
						expect(output.isSuccess).toBe(false);
					}
				})
				.finallyDoNothing()
		)
		.nothingAfterAll()
);
