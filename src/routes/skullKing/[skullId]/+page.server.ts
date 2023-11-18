import * as TE from 'fp-ts/lib/TaskEither';
import * as O from 'fp-ts/lib/Option';
import { isLeft } from 'fp-ts/lib/Either';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { SkullKings } from '$lib/server/skullKing/skullKing.repository.server';
import { pipe } from 'fp-ts/lib/function';
import { queryInvocation } from '$lib/query-invocation';
import { announce } from '$lib/usecase/announce';

export const load = async ({ locals, params, depends }: ServerLoadEvent) => {
	depends('skullKing');
	const response = await queryInvocation('skullking', locals, (user) =>
		pipe(
			params.skullId ? O.some(params.skullId) : O.none,
			TE.fromOption(() => 'Skull ID is missing'),
			TE.flatMap((skullId) => SkullKings.get(user, skullId))
		)
	)();

	if (isLeft(response)) {
		throw redirect(302, '/');
	}

	const skullKing = response.right;
	const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL;
	const wsBaseUrl: string = import.meta.env.VITE_WS_BASE_URL;
	return { skullKing, apiBaseUrl, wsBaseUrl };
};

export const actions = {
	announce: async ({ locals, request, params }: RequestEvent) => announce(locals, params, request)
};
