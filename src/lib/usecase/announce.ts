import { commandInvocation } from '$lib/command-invocation';
import { pipe } from 'fp-ts/lib/function';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { SkullKings } from '$lib/server/skullKing/skullKing.repository.server';
import { extractSkullId } from '$lib/usecase/command-utils';

export const announce = async (
	locals: App.Locals,
	params: Partial<Record<string, string>>,
	request: Request
) =>
	commandInvocation('announce', locals, (user) =>
		pipe(
			pipe(
				TE.Do,
				TE.apS('skullId', extractSkullId(params)),
				TE.apS('announce', extractAnnounce(request))
			),
			TE.flatMap(({ skullId, announce }) => SkullKings.announce(user, skullId, announce))
		)
	);

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
			!isNaN(formValue)
				? TE.right(formValue)
				: TE.left(`Could not parse announce from form data; ${formValue}; ${!isNaN(formValue)}`)
		)
	);
