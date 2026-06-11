import { DDLOperationOutput } from '@trayio/cdk-dsl/connector/operation/OperationHandler';

/** Standard DDL shape: { result: [{ text, value }] } with string values. */
export type ListLorasDdlOutput = DDLOperationOutput<string>;
