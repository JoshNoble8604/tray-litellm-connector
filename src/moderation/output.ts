export type ModerationOutput = {
	/** @title Flagged @description True if the text was flagged as harmful in any category. Branch on this for a safety gate. */
	flagged: boolean;
	/** @title Categories @description Per-category booleans (e.g. hate, self-harm, sexual, violence) for the text. */
	categories: object;
	/** @title Category Scores @description Per-category confidence scores (0–1) for the text. */
	category_scores: object;
	/** @title Results @description The full list of moderation results (one per input). */
	results: object[];
	/** @title Model @description The moderation model that served the request. */
	model: string;
};
