export type ImageGenerationOutput = {
	/** @title Image URL @description The URL of the first generated image (when the model returns URLs). Map this directly downstream. */
	url?: string;
	/** @title Image Base64 @description The base64-encoded data of the first generated image (when Response Format is b64_json). */
	b64_json?: string;
	/** @title Revised Prompt @description The prompt the model actually used after its own rewriting, if provided. */
	revised_prompt?: string;
	/** @title Images @description The full list of generated images — each has url and/or b64_json. */
	images: object[];
	/** @title Created @description Unix timestamp of when the images were generated. */
	created?: number;
};
