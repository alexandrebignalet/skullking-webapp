import { Rooms } from '$lib/server/room/room.repository.server';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import { commandInvocation } from '$lib/server/command-invocation';
import { queryInvocation } from '$lib/server/query-invocation';
import type { Room } from '$lib/domain/room';
import { of } from 'fp-ts/Task';

type QueryResponse = { rooms: Room[]; error?: string };
export const load = async ({ locals }: ServerLoadEvent): Promise<QueryResponse> =>
	pipe(
		queryInvocation(locals, Rooms.get),
		TE.fold<string, Room[], QueryResponse>(
			(error) => of({ rooms: [], error }),
			(rooms: Room[]) => of({ rooms, error: undefined })
		)
	)();

export const actions = {
	create: async ({ locals }: RequestEvent) => commandInvocation(locals, Rooms.create),

	bots: async ({ locals, request }: RequestEvent) =>
		commandInvocation(locals, (user) =>
			pipe(
				extractRoomId(request),
				TE.flatMap((roomId) => Rooms.addBot(user, roomId))
			)
		),

	join: async ({ locals, request }: RequestEvent) =>
		commandInvocation(locals, (user) =>
			pipe(
				extractRoomId(request),
				TE.flatMap((roomId) => Rooms.join(user, roomId))
			)
		),

	launch: async ({ locals, request }: RequestEvent) =>
		commandInvocation(locals, (user) =>
			pipe(
				extractRoomId(request),
				TE.flatMap((roomId) => Rooms.launch(user, roomId))
			)
		)
};

const extractRoomId = (request: Request): TaskEither<string, string> =>
	pipe(
		TE.tryCatch(
			() => request.formData(),
			(error) => {
				console.error(error);
				return `Could not parse form data; ${error} ${JSON.stringify(request)}`;
			}
		),
		TE.map((formData) => formData.get('roomId')),
		TE.flatMap((formValue) =>
			!!formValue && typeof formValue === 'string'
				? TE.right(formValue)
				: TE.left(`Could not parse roomId from form data; ${formValue}`)
		)
	);
