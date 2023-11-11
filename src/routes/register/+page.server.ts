import { AuthenticationRepository } from '$lib/server/authentication/authentication.repository.server';
import { isRight } from 'fp-ts/Either';
import { principalName } from '$lib/server/authentication/authentication';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { fromCookies } from '$lib/server/user/user';

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

export const load = async ({ cookies }: ServerLoadEvent) => {
	const user = fromCookies(cookies);

	if (isRight(user)) {
		throw redirect(302, '/');
	}

	return { user: undefined };
};
