export type WarmModelOutput = {
	/** @title Model @description The model that was warmed. */
	model: string;
	/** @title Ready @description True if the model responded successfully (loaded and serving). */
	ready: boolean;
	/** @title Status Code @description HTTP status from the warm-up request. */
	status_code: number;
};
