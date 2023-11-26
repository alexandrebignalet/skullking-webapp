import { commandInvocation } from '$lib/command-invocation';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { SkullKings } from '$lib/server/skullKing/skullKing.repository.server';
import type { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';
import type { ScaryMaryUsage } from '$lib/domain/skullKing';
import { scaryMaryUsages } from '$lib/domain/skullKing';
import { extractSkullId } from '$lib/usecase/command-utils';

export const play = async (
	locals: App.Locals,
	params: Partial<Record<string, string>>,
	request: Request
) =>
	commandInvocation('play', locals, (user) =>
		pipe(
			TE.Do,
			TE.apS('skullId', extractSkullId(params)),
			TE.apS('card', extractFormValues(request)),
			TE.flatMap(({ skullId, card }) => SkullKings.play(user, skullId, card.cardId, card.usage))
		)
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
