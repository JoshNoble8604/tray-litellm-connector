export type TextToSpeechInput = {
	/**
	 * @title Model
	 * @description The text-to-speech model name, e.g. tts-1 or tts-1-hd.
	 * @lookupOperation list_models_ddl
	 * @lookupInput {"modality":"audio_speech"}
	 * @lookupAuthRequired true
	 */
	model: string;
	/**
	 * @title Text
	 * @description The text to turn into speech.
	 */
	input: string;
	/**
	 * @title Voice
	 * @description The voice to use, e.g. alloy, echo, fable, onyx, nova, or shimmer.
	 */
	voice: string;
	/**
	 * @title Response Format
	 * @description Optional. Audio format: mp3 (default), opus, aac, flac, wav, or pcm.
	 */
	response_format?: string;
	/**
	 * @title Speed
	 * @description Optional. Playback speed from 0.25 to 4.0. Defaults to 1.0.
	 */
	speed?: number;
};
