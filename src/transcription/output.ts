export type TranscriptionOutput = {
	/** @title Text @description The transcribed text. Map this directly downstream. */
	text: string;
	/** @title Language @description The detected (or supplied) language, when the model returns it. */
	language?: string;
	/** @title Duration @description The audio duration in seconds, when the model returns it (verbose_json). */
	duration?: number;
	/** @title Segments @description Timestamped segments, when Response Format is verbose_json. */
	segments?: object[];
	/** @title Raw @description The full raw response body, for any fields not surfaced above. */
	raw?: object;
};
