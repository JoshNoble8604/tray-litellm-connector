import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { HealthCheckInput } from './input';
import { HealthCheckOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';

export const healthCheckHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	HealthCheckInput,
	HealthCheckOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.get('/health/liveliness')
			.handleRequest((ctx, input, request) => request.withoutBody())
			.handleResponse((ctx, input, response) =>
				response
					.withErrorHandling(() =>
						OperationHandlerResult.success({
							ok: false,
							status_code: response.getStatusCode(),
						})
					)
					.parseWithBodyAsText(() =>
						OperationHandlerResult.success({
							ok: true,
							status_code: response.getStatusCode(),
						})
					)
			)
	)
);
