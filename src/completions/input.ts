export type CompletionsInput = {
	/**
	 * @title Model
	 * @description The completion model name, e.g. gpt-3.5-turbo-instruct or a base model your proxy routes.
	 * @lookupOperation list_models_ddl
	 * @lookupInput {"modality":"chat"}
	 * @lookupAuthRequired true
	 */
	model: string;
	/**
	 * @title Prompt
	 * @description The text prompt to complete.
	 */
	prompt: string;
	/**
	 * @title Max Tokens
	 * @description Optional. Maximum number of tokens to generate.
	 */
	max_tokens?: number;
	/**
	 * @title Temperature
	 * @description Optional. 0 = focused and deterministic, higher = more creative. Leave blank for the model default.
	 */
	temperature?: number;
	/**
	 * @title Stop
	 * @description Optional. One or more strings that, when produced, stop generation.
	 */
	stop?: string[];
};
