import { pipe } from 'fp-ts/lib/function';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { z } from 'zod';

import {
	type ApiError,
	convertJson,
	extractResponse,
	httpCall,
	validateStatusCodeIsOrFail
} from '$lib/server/api/api';
import type { User } from '$lib/server/user/user';
import { BACKEND_AUTH_COOKIE_NAME, principalName } from '$lib/server/authentication/authentication';
import { env } from '$env/dynamic/private';
import type { Experiment } from '$lib/domain/experiment';
import { experimentSchema } from '$lib/domain/experiment';

const get = (user: User, experimentId: string): TaskEither<ApiError, Experiment> => {
	const apiBaseUrl = env.VITE_API_BASE_URL;

	const httpRequest = () =>
		fetch(`${apiBaseUrl}/experiments/${experimentId}`, {
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
		TE.flatMapEither(convertJson(experimentSchema))
	);
};

const list = (user: User): TaskEither<ApiError, Experiment[]> => {
	const apiBaseUrl = env.VITE_API_BASE_URL;

	const httpRequest = () =>
		fetch(`${apiBaseUrl}/experiments`, {
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
		TE.flatMapEither(convertJson(z.array(experimentSchema)))
	);
};

export const Experiments = {
	get,
	list
};
