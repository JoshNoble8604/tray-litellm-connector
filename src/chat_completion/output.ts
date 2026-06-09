export type ChatCompletionOutput = {
	/** @title Reply Text @description The assistant's reply (already extracted — map this directly downstream). */
	text: string;
	/** @title JSON @description The reply parsed as JSON, when the reply is a JSON object/array (otherwise empty). Use this instead of a parse script. */
	json?: object;
	/** @title Finish Reason @description Why generation stopped, e.g. "stop", "length", or "tool_calls" when the model wants to call a tool. */
	finish_reason: string;
	/** @title Message @description The full assistant message object (role, content, and tool_calls if any). Append this to your conversation history for multi-turn tool use. */
	message?: object;
	/** @title Tool Calls @description The tool calls the model requested, if any — each has id, type, and function.{name,arguments}. Empty when the model answered directly. */
	tool_calls?: object[];
	/** @title Model @description The model that actually served the request. */
	model: string;
	/** @title Usage @description Token usage for this call. */
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
};
