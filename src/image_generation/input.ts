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
	 * @default 25
	 */
	steps?: number;
	/**
	 * @title CFG Scale
	 * @description Optional (local SDXL/ComfyUI gateways). Prompt-adherence / guidance scale (e.g. 6–8). Ignored by hosted models.
	 * @default 7
	 */
	cfg?: number;
	/**
	 * @title Seed
	 * @description Optional (local SDXL/ComfyUI gateways). Seed for reproducible images. Leave at -1 for a random seed each run. Ignored by hosted models.
	 * @default -1
	 */
	seed?: number;
	/**
	 * @title LoRA 1
	 * @description Optional (local SDXL/ComfyUI gateways). Pick a LoRA available on the gateway. Stack more with LoRA 2/3/4. Ignored by hosted models.
	 * @lookupOperation list_loras_ddl
	 * @lookupInput {}
	 * @lookupAuthRequired true
	 */
	lora_1?: string;
	/**
	 * @title LoRA 1 Strength
	 * @description How strongly to apply LoRA 1 (0–1.5; 1.0 = full).
	 * @default 1.0
	 */
	lora_1_strength?: number;
	/**
	 * @title LoRA 2
	 * @description Optional. A second LoRA to stack on top of LoRA 1.
	 * @lookupOperation list_loras_ddl
	 * @lookupInput {}
	 * @lookupAuthRequired true
	 */
	lora_2?: string;
	/**
	 * @title LoRA 2 Strength
	 * @description How strongly to apply LoRA 2 (0–1.5; 1.0 = full).
	 * @default 1.0
	 */
	lora_2_strength?: number;
	/**
	 * @title LoRA 3
	 * @description Optional. A third LoRA to stack.
	 * @lookupOperation list_loras_ddl
	 * @lookupInput {}
	 * @lookupAuthRequired true
	 */
	lora_3?: string;
	/**
	 * @title LoRA 3 Strength
	 * @description How strongly to apply LoRA 3 (0–1.5; 1.0 = full).
	 * @default 1.0
	 */
	lora_3_strength?: number;
	/**
	 * @title LoRA 4
	 * @description Optional. A fourth LoRA to stack.
	 * @lookupOperation list_loras_ddl
	 * @lookupInput {}
	 * @lookupAuthRequired true
	 */
	lora_4?: string;
	/**
	 * @title LoRA 4 Strength
	 * @description How strongly to apply LoRA 4 (0–1.5; 1.0 = full).
	 * @default 1.0
	 */
	lora_4_strength?: number;
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
	 * @default b64_json
	 */
	response_format?: 'url' | 'b64_json';
	/**
	 * @title Keep Model Warm
	 * @description Optional (local SDXL/ComfyUI gateways). When true, the image model is kept loaded after this step instead of being unloaded — faster for back-to-back image steps, but holds GPU memory (blocks the large text model until a later non-warm render frees it). Leave off for one-off images.
	 * @default false
	 */
	keep_warm?: boolean;
};
