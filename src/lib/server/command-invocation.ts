import type { User } from '$lib/server/user/user';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { of } from 'fp-ts/Task';
import type { DomainError } from '$lib/domain/domain-error';
import { isDomainError } from '$lib/domain/domain-error';

type CommandResult =
	| { success: true; error: undefined }
	| { success: false; error: string | DomainError };

export const commandInvocation = <L, R>(
	locals: App.Locals,
	handler: (user: User) => TaskEither<L, R>
): Promise<CommandResult> =>
	pipe(
		TE.fromEither(locals.user),
		TE.flatMap(handler),
		TE.mapLeft((error): string | DomainError => {
			console.error(error);
			if (isDomainError(error)) {
				return error;
			}
			return 'Something went wrong, please try again later.';
		}),
		TE.fold<string | DomainError, R, CommandResult>(
			(error) => of({ success: false, error }),
			() => of({ success: true, error: undefined })
		)
	)();
