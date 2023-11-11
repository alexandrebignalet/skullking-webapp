import { pipe } from 'fp-ts/function';
import type { User } from '$lib/server/user/user';

import { isRight, map } from 'fp-ts/Either';
import type { ServerLoadEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }: ServerLoadEvent) => {
	const response = pipe(
		locals.user,
		map((user: User): { user: User } => ({ user }))
	);

	if (isRight(response)) {
		return response.right;
	}

	if (url.pathname !== '/register') {
		throw redirect(302, '/register');
	}

	return { user: undefined };
};
