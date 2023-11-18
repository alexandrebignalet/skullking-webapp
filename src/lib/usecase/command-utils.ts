import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';

export const extractSkullId = (
	params: Partial<Record<string, string>>
): TaskEither<string, string> =>
	pipe(
		params.skullId ? O.some(params.skullId) : O.none,
		TE.fromOption(() => 'Skull ID is missing')
	);
