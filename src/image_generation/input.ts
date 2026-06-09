export type ImageGenerationInput = {
	/**
	 * @title Model
	 * @description The image model available on your proxy — pick from the dropdown (the models your gateway exposes for image generation).
	 * @lookupOperation list_models_ddl
	 * @lookupInput {"modality":"image_generation"}
	 * @lookupAuthRequired true
	 */
	model: string;
	/**
	 * @title Prompt
	 * @description A text description of the image you want to generate.
	 */
	prompt: string;
	/**
	 * @title Number of Images
	 * @description Optional. How many images to generate. Defaults to 1.
	 * @default 1
	 */
	n?: number;
	/**
	 * @title Size
	 * @description Optional. Image dimensions, e.g. 1024x1024, 1792x1024, or 1024x1792.
	 * @default 1024x1024
	 */
	size?: string;
	/**
	 * @title Quality
	 * @description Optional. Rendering quality, e.g. standard or hd (dall-e-3), or low/medium/high (gpt-image-1).
	 */
	quality?: string;
	/**
	 * @title Style
	 * @description Optional. Visual style for dall-e-3: vivid or natural.
	 */
	style?: string;
	/**
	 * @title Response Format
	 * @description Optional. How the image is returned: url (default for some models) or b64_json.
	 */
	response_format?: string;
};
