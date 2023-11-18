import { AuthenticationRepository } from '$lib/server/authentication/authentication.repository.server';
import { isRight } from 'fp-ts/lib/Either';
import { principalName } from '$lib/server/authentication/authentication';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ cookies, request }: RequestEvent) => {
		const data = await request.formData();

		const userNameFormInputValue = data.get('userName');
		if (typeof userNameFormInputValue !== 'string') {
			return;
		}

		const response = await AuthenticationRepository.register(userNameFormInputValue);

		if (isRight(response)) {
			cookies.set('skullking-auth', principalName(response.right));
			throw redirect(302, '/');
		}

		return { user: undefined };
	}
};

export const load = async ({ locals }: ServerLoadEvent) => {
	if (isRight(locals.user)) {
		throw redirect(302, '/');
	}

	return { user: undefined };
};
