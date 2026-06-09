export type WarmModelInput = {
	/**
	 * @title Model
	 * @description The model name to warm up / load.
	 * @lookupOperation list_models_ddl
	 * @lookupInput {"modality":"chat"}
	 * @lookupAuthRequired true
	 */
	model: string;
};
