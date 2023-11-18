import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { play } from '$lib/usecase/play';

export const POST: RequestHandler = async ({ request, params, locals }) =>
	json(await play(locals, params, request));
