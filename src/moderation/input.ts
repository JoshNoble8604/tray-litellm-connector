export type ModerationInput = {
	/**
	 * @title Text
	 * @description The text to check for harmful content.
	 */
	input: string;
	/**
	 * @title Model
	 * @description Optional. The moderation model to use, e.g. omni-moderation-latest or text-moderation-latest. Leave blank for the proxy default.
	 * @lookupOperation list_models_ddl
	 * @lookupInput {"modality":"moderation"}
	 * @lookupAuthRequired true
	 */
	model?: string;
};
