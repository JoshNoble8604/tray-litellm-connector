import { FileReference } from '@trayio/cdk-dsl/connector/operation/OperationHandler';

export type TextToSpeechOutput = {
	/** @title Audio File @description The generated audio file (name, url, mime_type, expires). Map this into a downstream upload, attachment, or storage step. */
	file: FileReference;
};
