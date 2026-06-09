import { TokenOperationHandlerAuth } from '@trayio/cdk-dsl/connector/operation/OperationHandler';

/**
 * User-supplied authentication for the LiteLLM proxy.
 * These two fields are all a business user fills in once.
 */
export type UserAuth = {
	/**
	 * @title Endpoint URL
	 * @description Base URL of your LiteLLM proxy, with NO trailing slash and NO /v1 (the connector adds the path). Example: https://litellm.varition.com
	 */
	endpoint: string;
	/**
	 * @title API Key
	 * @description Your LiteLLM key (master or virtual). Sent as: Authorization: Bearer <key>.
	 */
	api_key: string;
};

export type AppAuth = Record<string, never>;

export type LitellmAuth = TokenOperationHandlerAuth<UserAuth, AppAuth>;
