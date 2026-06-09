export type CompletionsOutput = {
	/** @title Text @description The generated completion text. Map this directly downstream. */
	text: string;
	/** @title Finish Reason @description Why generation stopped, e.g. "stop" or "length". */
	finish_reason: string;
	/** @title Model @description The model that served the request. */
	model: string;
	/** @title Usage @description Token usage for this call. */
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
};
