import { transcriptionHandler } from './handler';

/*
 * Skipped in CI: exercising this handler requires (a) fetching a real audio
 * FileReference over the network and (b) a Whisper-capable model on the proxy
 * backend — neither is available against the local LM Studio test proxy. The
 * CDK's own multipart/file tests are skipped for the same reason. Verify this
 * operation live in the builder against a transcription-capable proxy.
 */
describe.skip('transcription (needs a Whisper-capable backend + file fetch)', () => {
	it('handler is defined', () => {
		expect(transcriptionHandler).toBeDefined();
	});
});
