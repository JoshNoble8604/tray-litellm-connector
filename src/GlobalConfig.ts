import { OperationGlobalConfigHttp } from '@trayio/cdk-dsl/connector/operation/OperationGlobalConfig';
import { LitellmAuth } from './LitellmAuth';

/*
 * Shared HTTP config for all LiteLLM operations.
 * Base URL = the user's proxy endpoint; auth = Bearer <api_key>.
 */
export const globalConfigHttp = OperationGlobalConfigHttp.create<LitellmAuth>()
	.withBaseUrl((ctx) => ctx.auth!.user.endpoint)
	.withBearerToken((ctx) => ctx.auth!.user.api_key);
