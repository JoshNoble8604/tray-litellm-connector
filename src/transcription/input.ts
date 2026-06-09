import { FileReference } from '@trayio/cdk-dsl/connector/operation/OperationHandler';

export type TranscriptionInput = {
	/**
	 * @title Model
	 * @description The speech-to-text model name, e.g. whisper-1.
	 * @lookupOperation list_models_ddl
	 * @lookupInput {"modality":"audio_transcription"}
	 * @lookupAuthRequired true
	 */
	model: string;
	/**
	 * @title Audio File
	 * @description The audio file to transcribe. Map a file object from an upstream step (e.g. an HTTP download or a trigger attachment).
	 */
	file: FileReference;
	/**
	 * @title Language
	 * @description Optional. The ISO-639-1 language of the audio (e.g. en, es) to improve accuracy. Leave blank to auto-detect.
	 */
	language?: string;
	/**
	 * @title Prompt
	 * @description Optional. A hint to guide the model's style or spelling of unusual words.
	 */
	prompt?: string;
	/**
	 * @title Temperature
	 * @description Optional. 0 = most literal. Higher allows more interpretation.
	 */
	temperature?: number;
	/**
	 * @title Response Format
	 * @description Optional. Keep as json (default) or verbose_json for segments/timestamps. Plain-text formats (text, srt, vtt) are not parsed here.
	 */
	response_format?: string;
};
