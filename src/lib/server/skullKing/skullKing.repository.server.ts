import { pipe } from 'fp-ts/function';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';

import type { ApiError } from '$lib/server/api/api';
import {
	convertJson,
	extractResponse,
	httpCall,
	isNetworkError,
	validateStatusCodeIs,
	validateStatusCodeIsOrFail
} from '$lib/server/api/api';
import type { User } from '$lib/server/user/user';
import { BACKEND_AUTH_COOKIE_NAME, principalName } from '$lib/server/authentication/authentication';
import type { ScaryMaryUsage, SkullKing } from '$lib/domain/skullKing';
import { skullKingSchema } from '$lib/domain/skullKing';
import type { DomainError } from '$lib/domain/domain-error';
import { domainErrorSchema } from '$lib/domain/domain-error';

const get = (user: User, skullId: string): TaskEither<ApiError, SkullKing> => {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

	const httpRequest = () =>
		fetch(`${apiBaseUrl}/skullking/games/${skullId}`, {
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
		TE.flatMapEither(convertJson(skullKingSchema))
	);
};

const announce = (user: User, skullId: string, announce: number): TaskEither<ApiError, void> => {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

	const httpRequest = () =>
		fetch(`${apiBaseUrl}/skullking/games/${skullId}/players/${user.id}/announce`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `${BACKEND_AUTH_COOKIE_NAME}=${principalName(user)}`
			},
			body: JSON.stringify({ count: announce })
		});

	return pipe(
		httpRequest,
		httpCall,
		TE.flatMapEither(validateStatusCodeIsOrFail(204)),
		TE.map(() => undefined)
	);
};

const play = (
	user: User,
	skullId: string,
	cardId: string,
	scaryMaryUsage: ScaryMaryUsage
): TaskEither<ApiError | DomainError, void> => {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

	const httpRequest = () =>
		fetch(`${apiBaseUrl}/skullking/games/${skullId}/players/${user.id}/play`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `${BACKEND_AUTH_COOKIE_NAME}=${principalName(user)}`
			},
			body: JSON.stringify({ cardId, usage: scaryMaryUsage })
		});

	return pipe(
		httpRequest,
		httpCall,
		TE.flatMapEither(validateStatusCodeIs(204)),
		TE.orElse((errorOrResponse): TaskEither<ApiError | DomainError, unknown> => {
			if (isNetworkError(errorOrResponse)) return TE.left(errorOrResponse);
			return pipe(
				extractResponse(errorOrResponse),
				TE.flatMapEither(convertJson(domainErrorSchema)),
				TE.flatMap(TE.left)
			);
		}),
		TE.map(() => undefined)
	);
};

export const SkullKings = {
	get,
	announce,
	play
};
