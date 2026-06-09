export type ResponsesOutput = {
	/** @title Text @description The assistant's reply text, aggregated from the output items. Map this directly downstream. */
	text: string;
	/** @title Status @description The response status, e.g. "completed" or "incomplete". */
	status: string;
	/** @title Output @description The full raw list of output items (messages, tool calls, etc.). */
	output: object[];
	/** @title Model @description The model that actually served the request. */
	model: string;
	/** @title Usage @description Token usage for this call (input_tokens, output_tokens, total_tokens). */
	usage?: object;
	/** @title Response ID @description The id of this response (use to chain follow-up turns via previous_response_id). */
	id?: string;
};
