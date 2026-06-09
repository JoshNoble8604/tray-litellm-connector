export type RerankInput = {
	/**
	 * @title Model
	 * @description The reranking model name, e.g. rerank-english-v3.0, cohere/rerank-v3.5, or a local reranker.
	 * @lookupOperation list_models_ddl
	 * @lookupInput {"modality":"rerank"}
	 * @lookupAuthRequired true
	 */
	model: string;
	/**
	 * @title Query
	 * @description The search query that the documents should be ranked against.
	 */
	query: string;
	/**
	 * @title Documents
	 * @description The list of document texts to rank by relevance to the query.
	 */
	documents: string[];
	/**
	 * @title Top N
	 * @description Optional. Return only the N most relevant documents. Leave blank to rank them all.
	 */
	top_n?: number;
	/**
	 * @title Return Documents
	 * @description Optional. When true, the document text is echoed back in each result. Ranked Documents is populated regardless.
	 */
	return_documents?: boolean;
};
