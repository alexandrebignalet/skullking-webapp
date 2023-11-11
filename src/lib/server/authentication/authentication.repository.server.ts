import type { AuthenticationError } from '$lib/server/authentication/authentication';
import { backendAuthCookieFrom } from '$lib/server/authentication/authentication';
import type { Either } from 'fp-ts/Either';
import { flatMap } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import type { User, UserError } from '$lib/server/user/user';
import { fromCookie } from '$lib/server/user/user';

const register = async (
	userName: string
): Promise<Either<AuthenticationError | UserError, User>> => {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
	const response = await fetch(`${apiBaseUrl}/skullking/register`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ userName })
	});

	return pipe(
		backendAuthCookieFrom(response.headers.get('Set-Cookie'), userName),
		flatMap(fromCookie)
	);
};

const isLoggedIn = () => false;

export const AuthenticationRepository = { isLoggedIn, register };
