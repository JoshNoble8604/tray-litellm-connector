export type ListModelsDdlInput = {
	/**
	 * @title Modality
	 * @description Optional. Only return models whose LiteLLM `mode` matches this (e.g. chat, embedding, image_generation, audio_transcription, audio_speech, rerank, moderation). If the proxy doesn't tag modality (no match), all models are returned so the dropdown is never empty.
	 */
	modality?: string;
};
