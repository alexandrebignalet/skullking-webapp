import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { announce } from '$lib/usecase/announce';
import { play } from '$lib/usecase/play';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	let commandResult;

	if (request.url.includes('announce')) {
		commandResult = await announce(locals, params, request);
	}

	if (request.url.includes('play')) {
		commandResult = await play(locals, params, request);
	}

	return json(commandResult);
};
