import type { User } from '$lib/server/user/user';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';

export const queryInvocation = <L, R>(
	locals: App.Locals,
	handler: (user: User) => TaskEither<L, R>
): TaskEither<string, R> =>
	pipe(
		TE.fromEither(locals.user),
		TE.flatMap(handler),
		TE.mapLeft((error) => {
			console.error(error);
			return 'Something went wrong, please try again later.';
		})
	);
