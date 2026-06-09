export type EmbeddingsOutput = {
	/** @title Embedding @description The embedding vector (array of numbers). */
	embedding: number[];
	/** @title Model @description The embedding model that served the request. */
	model: string;
	/** @title Usage @description Token usage for this call. */
	usage: {
		prompt_tokens: number;
		total_tokens: number;
	};
};
