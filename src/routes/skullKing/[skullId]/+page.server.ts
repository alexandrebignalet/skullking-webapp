import { isRight } from 'fp-ts/Either';
import type { ServerLoadEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }: ServerLoadEvent) => {
	if (isRight(locals.user)) {
		throw redirect(302, '/');
	}

	return { user: undefined };
};
