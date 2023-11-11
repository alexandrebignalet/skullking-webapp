import { Rooms } from '$lib/server/room/room.repository.server';
import * as TaskEither from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import type { Room } from '$lib/server/room/room';
import { of } from 'fp-ts/Task';
import { fromCookies } from '$lib/server/user/user';
import type { ServerLoadEvent } from '@sveltejs/kit';

type Props = { error: string | undefined; rooms: Room[] };

export const load = async ({ cookies }: ServerLoadEvent): Promise<Props> =>
	pipe(
		TaskEither.fromEither(fromCookies(cookies)),
		TaskEither.flatMap(Rooms.get),
		TaskEither.mapLeft((error) => {
			console.error(error);
			return 'Something went wrong, please try again later.';
		}),
		TaskEither.fold<string, Room[], Props>(
			(error) => of({ error, rooms: [] }),
			(rooms: Room[]) => of({ error: undefined, rooms })
		)
	)();
