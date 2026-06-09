export type EmbeddingsInput = {
	/**
	 * @title Model
	 * @description The LiteLLM embedding model name, e.g. mxbai-embed or text-embedding-3-small.
	 * @lookupOperation list_models_ddl
	 * @lookupInput {"modality":"embedding"}
	 * @lookupAuthRequired true
	 */
	model: string;
	/**
	 * @title Text
	 * @description The text to convert into an embedding vector.
	 */
	input: string;
};
