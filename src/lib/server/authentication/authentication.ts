import type { Either } from 'fp-ts/lib/Either';
import { left, right } from 'fp-ts/lib/Either';
import type { User } from '$lib/server/user/user';

export type BackendAuth = string;
export type AuthenticationError = { code: 'REGISTER_FAILED'; message: string };

const authenticationError = (message: string): AuthenticationError => ({
	code: 'REGISTER_FAILED',
	message
});

export const principalName = (user: User) => `${user.id}:${user.userName}`;

export const BACKEND_AUTH_COOKIE_NAME = 'skullking-auth';
export const BACKEND_USER_ID_PREFIX = 'usr_';

export const validateBackendCookie = (
	value: string | undefined,
	expectedUserName: string
): value is string =>
	!!value && value.startsWith(BACKEND_USER_ID_PREFIX) && value.endsWith(expectedUserName);

export const backendAuthCookieFrom = (
	rawCookies: string | null,
	expectedUserName: string
): Either<AuthenticationError, BackendAuth> => {
	if (!rawCookies) {
		return left(authenticationError(`Couldn't find cookie in response, ${rawCookies}`));
	}

	const cookies = parseCookie(rawCookies);
	const authCookie = cookies[BACKEND_AUTH_COOKIE_NAME];

	const validation = validateBackendCookie(authCookie, expectedUserName);

	return validation
		? right(authCookie)
		: left(
				authenticationError(
					`invalid cookie in response; authCookie=${authCookie} userName=${expectedUserName}`
				)
		  );
};

const parseCookie = (str: string): Record<string, string | undefined> =>
	str
		.split(';')
		.map((v: string): string[] => v.split('='))
		.reduce((acc: Record<string, string>, v: string[]) => {
			const cookieKey = v[0].trim();
			const cookieValue = v[1].trim();

			if (!cookieKey) {
				return acc;
			}

			acc[decodeURIComponent(cookieKey)] = JSON.parse(decodeURIComponent(cookieValue));
			return acc;
		}, {});
