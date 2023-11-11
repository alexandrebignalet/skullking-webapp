import type { Either } from 'fp-ts/Either';
import { flatMap, left, right } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import {
	BACKEND_AUTH_COOKIE_NAME,
	BACKEND_USER_ID_PREFIX
} from '$lib/server/authentication/authentication';
import type { Cookies } from '@sveltejs/kit';

export const WEBAPP_AUTH_COOKIE_NAME = BACKEND_AUTH_COOKIE_NAME;

export type User = {
	id: string;
	userName: string;
};

export type UserError = { code: 'USER_NOT_FOUND'; message: string };

export const fromCookies = (cookies: Cookies): Either<UserError, User> =>
	pipe(cookies.get(WEBAPP_AUTH_COOKIE_NAME), fromCookie);

export const fromCookie = (cookie: string | undefined) =>
	pipe(
		cookie
			? right(cookie.split(':'))
			: left<UserError>({
					code: 'USER_NOT_FOUND',
					message: `No cookie; cookie=${cookie}`
			  }),
		flatMap((parts) =>
			parts.length === 2
				? right(parts)
				: left<UserError>({
						code: 'USER_NOT_FOUND',
						message: `Invalid cookie; cookieParts=${parts}`
				  })
		),
		flatMap(([id, userName]) =>
			id.startsWith(BACKEND_USER_ID_PREFIX) && !!userName
				? right({ id, userName })
				: left<UserError>({
						code: 'USER_NOT_FOUND',
						message: `Invalid cookie infos; id=${id} userName:${userName}`
				  })
		)
	);
