import type { Handle } from '@sveltejs/kit';
import type { User, UserError } from '$lib/server/user/user';
import { fromCookie, WEBAPP_AUTH_COOKIE_NAME } from '$lib/server/user/user';
import { pipe } from 'fp-ts/function';
import type { Either } from 'fp-ts/Either';

export const handle: Handle = async ({ event, resolve }) => {
	const overrideAppLocals = (user: Either<UserError, User>) => {
		event.locals.user = user;
		return event;
	};
	return pipe(event.cookies.get(WEBAPP_AUTH_COOKIE_NAME), fromCookie, overrideAppLocals, resolve);
};
