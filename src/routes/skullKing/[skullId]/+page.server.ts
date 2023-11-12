import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import type { Either } from 'fp-ts/Either';
import * as E from 'fp-ts/Either';
import { isLeft } from 'fp-ts/Either';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { queryInvocation } from '$lib/server/query-invocation';
import { SkullKings } from '$lib/server/skullKing/skullKing.repository.server';
import { pipe } from 'fp-ts/function';
import { commandInvocation } from '$lib/server/command-invocation';
import type { ScaryMaryUsage } from '$lib/domain/skullKing';
import { scaryMaryUsages } from '$lib/domain/skullKing';

export const load = async ({ locals, params }: ServerLoadEvent) => {
	const response = await queryInvocation(locals, (user) =>
		pipe(
			params.skullId ? O.some(params.skullId) : O.none,
			TE.fromOption(() => 'Skull ID is missing'),
			TE.flatMap((skullId) => SkullKings.get(user, skullId))
		)
	)();

	if (isLeft(response)) {
		throw redirect(302, '/');
	}

	return { skullKing: response.right };
};

export const actions = {
	announce: async ({ locals, request, params }: RequestEvent) =>
		commandInvocation(locals, (user) =>
			pipe(
				pipe(
					TE.Do,
					TE.apS('skullId', extractSkullId(params)),
					TE.apS('announce', extractAnnounce(request))
				),
				TE.flatMap(({ skullId, announce }) => SkullKings.announce(user, skullId, announce))
			)
		),

	play: async ({ locals, request, params }: RequestEvent) =>
		commandInvocation(locals, (user) =>
			pipe(
				TE.Do,
				TE.apS('skullId', extractSkullId(params)),
				TE.apS('card', extractFormValues(request)),
				TE.flatMap(({ skullId, card }) => SkullKings.play(user, skullId, card.cardId, card.usage))
			)
		)
};

const extractSkullId = (params: Partial<Record<string, string>>): TaskEither<string, string> =>
	pipe(
		params.skullId ? O.some(params.skullId) : O.none,
		TE.fromOption(() => 'Skull ID is missing')
	);

const extractFormValues = (request: Request) =>
	pipe(
		TE.tryCatch(
			() => request.formData(),
			(error) => {
				console.error(error);
				return `Could not parse form data; ${error} ${JSON.stringify(request)}`;
			}
		),
		TE.flatMapEither((formData) =>
			pipe(
				E.Do,
				E.apS('cardId', extractCardId(formData)),
				E.apS('usage', E.right(extractScaryMaryUsage(formData)))
			)
		)
	);

const extractScaryMaryUsage = (formData: FormData): ScaryMaryUsage => {
	const formValue = formData.get('usage');
	return !formValue || formValue === 'NOT_SET'
		? scaryMaryUsages.NOT_SET
		: scaryMaryUsages[formValue as ScaryMaryUsage];
};

const extractCardId = (formData: FormData): Either<string, string> => {
	const formValue = formData.get('cardId');
	return !!formValue && typeof formValue === 'string'
		? E.right(formValue)
		: E.left(`Could not parse cardId from form data; ${formValue}`);
};

const extractAnnounce = (request: Request): TaskEither<string, number> =>
	pipe(
		TE.tryCatch(
			() => request.formData(),
			(error) => {
				console.error(error);
				return `Could not parse form data; ${error} ${JSON.stringify(request)}`;
			}
		),
		TE.map((formData) => Number(formData.get('announce'))),
		TE.flatMap((formValue) =>
			!!formValue && !isNaN(formValue)
				? TE.right(formValue)
				: TE.left(`Could not parse skullId from form data; ${formValue}`)
		)
	);
