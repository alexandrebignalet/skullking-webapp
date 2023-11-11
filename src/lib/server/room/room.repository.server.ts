import type { Either } from 'fp-ts/Either';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';
import { z, ZodType } from 'zod';

import type {
	ApiContractError,
	ApiError,
	ApiFailureError,
	JsonDeserializationError,
	NetworkError
} from '$lib/server/api/api';
import type { User } from '$lib/server/user/user';
import { BACKEND_AUTH_COOKIE_NAME, principalName } from '$lib/server/authentication/authentication';
import type { Room } from '$lib/domain/room';
import { gameRoomSchema } from '$lib/domain/room';

const validateStatusCodeIs =
	(statusCode: number) =>
	(response: Response): Either<ApiFailureError, Response> =>
		response.status === statusCode
			? E.right(response)
			: E.left({
					code: 'API_FAILURE',
					reason: response,
					expectedStatusCode: statusCode
			  });

const httpCall = (httpRequest: () => Promise<Response>) =>
	TE.tryCatch<NetworkError, Response>(
		() => httpRequest(),
		(reason) => ({ code: 'NETWORK_ERROR', reason })
	);

const extractResponse = (response: Response) =>
	TE.tryCatch<JsonDeserializationError, Response>(
		() => response.json(),
		(reason) => ({ code: 'JSON_DESERIALIZATION_ERROR', reason })
	);

const convertJson =
	<O, D extends z.ZodTypeDef, I>(schema: ZodType<O, D, I>) =>
	(json: unknown) =>
		E.tryCatch<ApiContractError, z.infer<typeof schema>>(
			() => schema.parse(json),
			(reason) => ({ code: 'API_CONTRACT_ERROR', reason, json })
		);

const get = (user: User): TaskEither<ApiError, Room[]> => {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

	const httpRequest = () =>
		fetch(`${apiBaseUrl}/skullking/game_rooms`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Cookie: `${BACKEND_AUTH_COOKIE_NAME}=${principalName(user)}`
			}
		});

	return pipe(
		httpRequest,
		httpCall,
		TE.flatMapEither(validateStatusCodeIs(200)),
		TE.flatMap(extractResponse),
		TE.flatMapEither(convertJson(z.array(gameRoomSchema)))
	);
};

const create = (user: User): TaskEither<ApiError, void> => {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

	const httpRequest = () =>
		fetch(`${apiBaseUrl}/skullking/game_rooms`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				Cookie: `${BACKEND_AUTH_COOKIE_NAME}=${principalName(user)}`
			}
		});

	const httpCall = TE.tryCatch<NetworkError, Response>(
		() => httpRequest(),
		(reason) => ({ code: 'NETWORK_ERROR', reason })
	);

	return pipe(
		httpCall,
		TE.flatMapEither(validateStatusCodeIs(200)),
		TE.map(() => undefined)
	);
};

const addBot = (user: User, roomId: string): TaskEither<ApiError, void> => {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

	const httpRequest = () =>
		fetch(`${apiBaseUrl}/skullking/game_rooms/${roomId}/bots`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				Cookie: `${BACKEND_AUTH_COOKIE_NAME}=${principalName(user)}`
			}
		});

	return pipe(
		httpRequest,
		httpCall,
		TE.flatMapEither(validateStatusCodeIs(200)),
		TE.map(() => undefined)
	);
};

const join = (user: User, roomId: string): TaskEither<ApiError, void> => {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

	const httpRequest = () =>
		fetch(`${apiBaseUrl}/skullking/game_rooms/${roomId}/join`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				Cookie: `${BACKEND_AUTH_COOKIE_NAME}=${principalName(user)}`
			}
		});

	return pipe(
		httpRequest,
		httpCall,
		TE.flatMapEither(validateStatusCodeIs(200)),
		TE.map(() => undefined)
	);
};

const launch = (user: User, roomId: string): TaskEither<ApiError, void> => {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

	const httpRequest = () =>
		fetch(`${apiBaseUrl}/skullking/game_rooms/${roomId}/launch`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				Cookie: `${BACKEND_AUTH_COOKIE_NAME}=${principalName(user)}`
			}
		});

	return pipe(
		httpRequest,
		httpCall,
		TE.flatMapEither(validateStatusCodeIs(200)),
		TE.map(() => undefined)
	);
};

export const Rooms = {
	get,
	create,
	addBot,
	join,
	launch
};
