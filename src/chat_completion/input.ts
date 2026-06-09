export type ChatMessage = {
	/** @title Role @description One of: system, user, assistant, tool. */
	role: string;
	/** @title Content @description The message text. May be empty on an assistant message that only requests tools. */
	content?: string;
	/** @title Name @description Optional. On a tool-result message, the name of the tool/function that produced it. */
	name?: string;
	/** @title Tool Call ID @description Optional. On a tool-result message, the id of the assistant tool call it answers. */
	tool_call_id?: string;
	/** @title Tool Calls @description Optional. On an assistant message, the tool calls it requested — pass back verbatim from a previous reply's Tool Calls output to continue the conversation. */
	tool_calls?: object[];
};

export type ChatCompletionInput = {
	/**
	 * @title Model
	 * @description The LiteLLM model name to use, e.g. claude-sonnet, gpt-4o, or local.
	 * @lookupOperation list_models_ddl
	 * @lookupInput {"modality":"chat"}
	 * @lookupAuthRequired true
	 */
	model: string;
	/**
	 * @title System Prompt
	 * @description Optional instructions that set how the assistant should behave.
	 */
	system_prompt?: string;
	/**
	 * @title User Prompt
	 * @description The user's message. Provide this (the simple case), or use Messages for a full multi-turn conversation.
	 */
	user_prompt?: string;
	/**
	 * @title Messages
	 * @description Advanced: a full chat history. When provided, this overrides System Prompt and User Prompt.
	 */
	messages?: ChatMessage[];
	/**
	 * @title Temperature
	 * @description 0 = focused and deterministic, higher = more creative. Leave blank for the model default.
	 */
	temperature?: number;
	/**
	 * @title Max Tokens
	 * @description Maximum number of tokens to generate in the reply.
	 */
	max_tokens?: number;
	/**
	 * @title JSON Response
	 * @description When true, constrains the model to return valid JSON (object or array) using a permissive json_schema — works on OpenAI-compatible gateways including LM Studio. Use when your prompt asks for JSON; the reply is also parsed into the JSON output. For a specific shape, use Response Format with your own json_schema instead.
	 * @default false
	 */
	json_response?: boolean;
	/**
	 * @title Response Format
	 * @description Advanced: a raw OpenAI response_format object, e.g. {"type":"json_schema","json_schema":{...}}. Overrides JSON Response when set.
	 */
	response_format?: object;
	/**
	 * @title Tools
	 * @description Advanced: a list of tool/function definitions in OpenAI format, e.g. [{"type":"function","function":{"name":...,"description":...,"parameters":{...}}}]. When the model decides to use one, the Tool Calls output is populated and Finish Reason is "tool_calls".
	 */
	tools?: object[];
	/**
	 * @title Tool Choice
	 * @description Advanced: how the model selects tools — "auto" (default), "none", or "required". Only applies when Tools is set.
	 */
	tool_choice?: string;
};
