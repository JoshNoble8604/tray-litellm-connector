export type ListModelsOutput = {
	/** @title Models @description The available model names — use one of these in a Chat Completion's Model field. */
	models: string[];
	/** @title Count @description How many models are available. */
	count: number;
};
