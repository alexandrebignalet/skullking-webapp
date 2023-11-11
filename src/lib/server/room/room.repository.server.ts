import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';
import { z } from 'zod';
import type { Room } from '$lib/server/room/room';
import { gameRoomSchema } from '$lib/server/room/room';
import type {
	ApiContractError,
	ApiError,
	JsonDeserializationError,
	NetworkError
} from '$lib/server/api/api';
import type { User } from '$lib/server/user/user';
import { BACKEND_AUTH_COOKIE_NAME, principalName } from '$lib/server/authentication/authentication';

const get = (user: User): TaskEither<ApiError, Room[]> => {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

	async function httpRequest(): Promise<Response> {
		return await fetch(`${apiBaseUrl}/skullking/game_rooms`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Cookie: `${BACKEND_AUTH_COOKIE_NAME}=${principalName(user)}`
			}
		});
	}

	const httpCall = TE.tryCatch<NetworkError, Response>(
		() => httpRequest(),
		(reason) => ({ code: 'NETWORK_ERROR', reason })
	);

	const extractResponse = (response: Response) =>
		TE.tryCatch<JsonDeserializationError, Response>(
			() => response.json(),
			(reason) => ({ code: 'JSON_DESERIALIZATION_ERROR', reason })
		);

	const convertJson = (json: unknown) =>
		E.tryCatch<ApiContractError, Room[]>(
			() => z.array(gameRoomSchema).parse(json),
			(reason) => ({ code: 'API_CONTRACT_ERROR', reason, json })
		);

	return pipe(httpCall, TE.flatMap(extractResponse), TE.flatMapEither(convertJson));
};

export const Rooms = { get };
