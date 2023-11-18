import { Rooms } from '$lib/server/room/room.repository.server';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import type { Room } from '$lib/domain/room';
import { of } from 'fp-ts/lib/Task';
import { queryInvocation } from '$lib/query-invocation';
import { commandInvocation } from '$lib/command-invocation';

type QueryResponse = { rooms: Room[]; error?: string };
export const load = async ({ locals }: ServerLoadEvent): Promise<QueryResponse> =>
	pipe(
		queryInvocation('rooms', locals, Rooms.get),
		TE.fold<string, Room[], QueryResponse>(
			(error) => of({ rooms: [], error }),
			(rooms: Room[]) => of({ rooms, error: undefined })
		)
	)();

export const actions = {
	create: async ({ locals }: RequestEvent) => commandInvocation('create', locals, Rooms.create),

	bots: async ({ locals, request }: RequestEvent) =>
		commandInvocation('bots', locals, (user) =>
			pipe(
				extractRoomId(request),
				TE.flatMap((roomId) => Rooms.addBot(user, roomId))
			)
		),

	join: async ({ locals, request }: RequestEvent) =>
		commandInvocation('join', locals, (user) =>
			pipe(
				extractRoomId(request),
				TE.flatMap((roomId) => Rooms.join(user, roomId))
			)
		),

	launch: async ({ locals, request }: RequestEvent) =>
		commandInvocation('launch', locals, (user) =>
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
