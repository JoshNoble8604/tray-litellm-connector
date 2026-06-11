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
	 * @title Negative Prompt
	 * @description Optional (local SDXL/ComfyUI gateways). What to avoid in the image. Ignored by hosted models like dall-e.
	 */
	negative_prompt?: string;
	/**
	 * @title Number of Images
	 * @description Optional. How many images to generate. Defaults to 1.
	 * @default 1
	 */
	n?: number;
	/**
	 * @title Size
	 * @description Optional. Image dimensions. Pick a supported size for your model (square + common SDXL/dall-e aspect ratios).
	 * @default 1024x1024
	 */
	size?:
		| '1024x1024'
		| '1152x896'
		| '896x1152'
		| '1216x832'
		| '832x1216'
		| '1344x768'
		| '768x1344'
		| '1792x1024'
		| '1024x1792';
	/**
	 * @title Steps
	 * @description Optional (local SDXL/ComfyUI gateways). Number of diffusion steps (e.g. 20–30). Ignored by hosted models.
	 */
	steps?: number;
	/**
	 * @title CFG Scale
	 * @description Optional (local SDXL/ComfyUI gateways). Prompt-adherence / guidance scale (e.g. 6–8). Ignored by hosted models.
	 */
	cfg?: number;
	/**
	 * @title Seed
	 * @description Optional (local SDXL/ComfyUI gateways). Fix the random seed for reproducible images; omit for a random seed.
	 */
	seed?: number;
	/**
	 * @title LoRA
	 * @description Optional (local SDXL/ComfyUI gateways). A LoRA to apply — a known alias (e.g. "pony-smooth-style") or a raw .safetensors filename available on the gateway.
	 */
	lora?: string;
	/**
	 * @title LoRA Strength
	 * @description Optional. How strongly to apply the LoRA (0–1.5; 1.0 = full). Only used when a LoRA is set.
	 * @default 1.0
	 */
	lora_strength?: number;
	/**
	 * @title Quality
	 * @description Optional (hosted models). Rendering quality: standard/hd for dall-e-3, or low/medium/high for gpt-image-1.
	 */
	quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high';
	/**
	 * @title Style
	 * @description Optional (dall-e-3 only). Visual style.
	 */
	style?: 'vivid' | 'natural';
	/**
	 * @title Response Format
	 * @description Optional. How the image is returned: a URL or base64-encoded data.
	 */
	response_format?: 'url' | 'b64_json';
	/**
	 * @title Keep Model Warm
	 * @description Optional (local SDXL/ComfyUI gateways). When true, the image model is kept loaded after this step instead of being unloaded — faster for back-to-back image steps, but holds GPU memory (blocks the large text model until a later non-warm render frees it). Leave off for one-off images.
	 * @default false
	 */
	keep_warm?: boolean;
};
