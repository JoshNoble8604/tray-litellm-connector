export type RedactPiiInput = {
	/**
	 * @title Text
	 * @description The text to scan and redact. Detected PII/PHI is replaced with <ENTITY_TYPE> placeholders.
	 */
	text: string;
	/**
	 * @title Language
	 * @description Optional ISO-639-1 language of the text (default: en).
	 */
	language?: string;
};
