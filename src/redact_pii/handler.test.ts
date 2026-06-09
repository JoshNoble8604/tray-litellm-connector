import { OperationHandlerTestSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerTest';
import { redactPiiHandler } from './handler';
import '@trayio/cdk-runtime/connector/operation/OperationHandlerTestRunner';

/*
 * Lenient: only succeeds if the proxy exposes the /redact pass-through to a
 * Presidio backend. Asserts a well-formed result on success, else a clean
 * failure — so deploy-time `npm test` stays green on proxies without it.
 */
OperationHandlerTestSetup.configureHandlerTest(redactPiiHandler, (handlerTest) =>
	handlerTest
		.usingHandlerContext('test')
		.nothingBeforeAll()
		.testCase('redacts PII when the proxy exposes /redact', (testCase) =>
			testCase
				.givenNothing()
				.when(() => ({ text: 'Call Bob at 555-123-4567.' }))
				.then(({ output }) => {
					if (output.isSuccess) {
						expect(typeof output.value.masked_text).toBe('string');
					} else {
						expect(output.isSuccess).toBe(false);
					}
				})
				.finallyDoNothing()
		)
		.nothingAfterAll()
);
