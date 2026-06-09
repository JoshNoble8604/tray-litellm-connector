import { textToSpeechHandler } from './handler';

/*
 * Skipped in CI: this handler returns a binary audio file and needs a
 * TTS-capable model on the proxy backend, which the local LM Studio test proxy
 * does not provide. The CDK's own file-response tests are skipped for the same
 * reason. Verify this operation live in the builder against a TTS-capable proxy.
 */
describe.skip('text_to_speech (needs a TTS-capable backend)', () => {
	it('handler is defined', () => {
		expect(textToSpeechHandler).toBeDefined();
	});
});
