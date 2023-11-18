import type { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import type { z, ZodType } from 'zod';
import { pipe } from 'fp-ts/lib/function';

export type NetworkError = { code: 'NETWORK_ERROR'; reason: unknown };
export type ApiFailureError = { code: 'API_FAILURE'; reason: unknown; expectedStatusCode: number };
export type JsonDeserializationError = {
	code: 'JSON_DESERIALIZATION_ERROR';
	reason: unknown;
	response: Response;
};
export type ApiContractError = { code: 'API_CONTRACT_ERROR'; reason: unknown; json: unknown };

export type ApiError = NetworkError | JsonDeserializationError | ApiContractError | ApiFailureError;

export const isNetworkError = (error: unknown): error is NetworkError =>
	error !== null && typeof error === 'object' && 'code' in error && error.code === 'NETWORK_ERROR';

export const validateStatusCodeIsOrFail =
	(statusCode: number) =>
	(response: Response): Either<ApiFailureError, Response> =>
		response.status === statusCode
			? E.right(response)
			: E.left({
					code: 'API_FAILURE',
					reason: response,
					expectedStatusCode: statusCode
			  });

export const validateStatusCodeIs =
	(statusCode: number) =>
	(response: Response): Either<Response, Response> =>
		response.status === statusCode ? E.right(response) : E.left(response);

export const httpCall = (httpRequest: () => Promise<Response>) =>
	TE.tryCatch<NetworkError, Response>(
		() => httpRequest(),
		(reason) => ({ code: 'NETWORK_ERROR', reason })
	);

export const extractResponse = (response: Response) =>
	pipe(
		TE.tryCatch<JsonDeserializationError, Response>(
			() => response.json(),
			(reason) => ({ code: 'JSON_DESERIALIZATION_ERROR', reason, response })
		)
	);

export const convertJson =
	<O, D extends z.ZodTypeDef, I>(schema: ZodType<O, D, I>) =>
	(json: unknown) =>
		E.tryCatch<ApiContractError, z.infer<typeof schema>>(
			() => schema.parse(json),
			(reason) => ({ code: 'API_CONTRACT_ERROR', reason, json })
		);
