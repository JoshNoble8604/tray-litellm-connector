import { OperationHandlerSetup } from '@trayio/cdk-dsl/connector/operation/OperationHandlerSetup';
import { OperationHandlerResult } from '@trayio/cdk-dsl/connector/operation/OperationHandler';
import { LitellmAuth } from '../LitellmAuth';
import { ListModelsInput } from './input';
import { ListModelsOutput } from './output';
import { globalConfigHttp } from '../GlobalConfig';

type RawModels = { data: Array<{ id: string }> };

export const listModelsHandler = OperationHandlerSetup.configureHandler<
	LitellmAuth,
	ListModelsInput,
	ListModelsOutput
>((handler) =>
	handler.withGlobalConfiguration(globalConfigHttp).usingHttp((http) =>
		http
			.get('/v1/models')
			.handleRequest((ctx, input, request) => request.withoutBody())
			.handleResponse((ctx, input, response) =>
				response.parseWithBodyAsJson((body: RawModels) => {
					const models = (body.data || []).map((m) => m.id);
					return OperationHandlerResult.success({
						models,
						count: models.length,
					});
				})
			)
	)
);
