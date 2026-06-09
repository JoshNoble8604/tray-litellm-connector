export type RerankOutput = {
	/** @title Top Document @description The single most relevant document text (empty if none returned). Map this directly downstream. */
	top_document?: string;
	/** @title Top Score @description The relevance score of the top document (higher = more relevant). */
	top_score?: number;
	/** @title Ranked Documents @description The input documents reordered from most to least relevant. Use this instead of a re-sort script. */
	ranked_documents: string[];
	/** @title Results @description The full ranked results — each has index (into the original Documents), relevance_score, and document (when Return Documents is true). */
	results: object[];
	/** @title Model @description The reranking model that served the request. */
	model?: string;
};
