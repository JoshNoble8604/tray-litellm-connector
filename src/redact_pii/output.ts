export type RedactPiiOutput = {
	/** @title Masked Text @description The input with detected PII/PHI replaced by <ENTITY_TYPE> placeholders. Map this directly downstream. */
	masked_text: string;
	/** @title Entities @description The detected entities — each has type, start, end, and score. */
	entities: object[];
	/** @title Count @description How many PII/PHI entities were detected. */
	count: number;
};
