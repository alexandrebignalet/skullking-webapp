import { pipe } from 'fp-ts/lib/function';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { z } from 'zod';

import {
	type ApiError,
	convertJson,
	extractResponse,
	httpCall,
	type NetworkError,
	validateStatusCodeIsOrFail
} from '$lib/server/api/api';
import type { User } from '$lib/server/user/user';
import { BACKEND_AUTH_COOKIE_NAME, principalName } from '$lib/server/authentication/authentication';
import type { Room } from '$lib/domain/room';
import { gameRoomSchema } from '$lib/domain/room';
import type { SkullKingId } from '$lib/domain/skullKing';

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
		TE.flatMapEither(validateStatusCodeIsOrFail(200)),
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
		TE.flatMapEither(validateStatusCodeIsOrFail(200)),
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
		TE.flatMapEither(validateStatusCodeIsOrFail(200)),
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
		TE.flatMapEither(validateStatusCodeIsOrFail(200)),
		TE.map(() => undefined)
	);
};

const launchResponseSchema = z.object({
	gameId: z.string()
});

const launch = (user: User, roomId: string): TaskEither<ApiError, SkullKingId> => {
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
		TE.flatMapEither(validateStatusCodeIsOrFail(200)),
		TE.flatMap(extractResponse),
		TE.flatMapEither(convertJson(launchResponseSchema)),
		TE.map(({ gameId: skullId }) => skullId)
	);
};

export const Rooms = {
	get,
	create,
	addBot,
	join,
	launch
};
