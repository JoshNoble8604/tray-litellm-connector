export type ResponsesInput = {
	/**
	 * @title Model
	 * @description The model name to use, e.g. gpt-4o or a provider-prefixed model your proxy routes.
	 * @lookupOperation list_models_ddl
	 * @lookupInput {"modality":"chat"}
	 * @lookupAuthRequired true
	 */
	model: string;
	/**
	 * @title Input
	 * @description The user input / prompt to respond to.
	 */
	input: string;
	/**
	 * @title Instructions
	 * @description Optional. System-level instructions that set how the assistant should behave.
	 */
	instructions?: string;
	/**
	 * @title Max Output Tokens
	 * @description Optional. Maximum number of tokens to generate in the response.
	 */
	max_output_tokens?: number;
	/**
	 * @title Temperature
	 * @description Optional. 0 = focused and deterministic, higher = more creative. Leave blank for the model default.
	 */
	temperature?: number;
};
