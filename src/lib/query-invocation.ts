import type { User } from '$lib/server/user/user';
import type { TaskEither } from 'fp-ts/lib/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';

export const queryInvocation = <L, R>(
	name: string,
	locals: App.Locals,
	handler: (user: User) => TaskEither<L, R>
): TaskEither<string, R> => {
	pipe(
		locals.user,
		E.map((user) => console.log(`Query [${name}] invoked by [${user.id}:${user.userName}]`)),
		E.mapLeft((error) => console.error(`Query ${name} invoked without user: ${error}`))
	);
	return pipe(
		TE.fromEither(locals.user),
		TE.flatMap(handler),
		TE.mapLeft((error) => {
			console.error(error);
			return 'Something went wrong, please try again later.';
		})
	);
};
