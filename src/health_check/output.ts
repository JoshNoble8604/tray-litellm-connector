export type HealthCheckOutput = {
	/** @title OK @description True if the proxy responded. */
	ok: boolean;
	/** @title Status Code @description HTTP status from the proxy's liveness endpoint. */
	status_code: number;
};
