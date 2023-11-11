import { Rooms } from '$lib/server/room/room.repository.server';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import type { Room } from '$lib/server/room/room';
import { of } from 'fp-ts/Task';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import type { User } from '$lib/server/user/user';

type Props = {
	error: string | undefined;
	rooms: Room[];
};

export const load = async ({ locals }: ServerLoadEvent): Promise<Props> =>
	pipe(
		TE.fromEither(locals.user),
		TE.flatMap(Rooms.get),
		TE.mapLeft((error) => {
			console.error(error);
			return 'Something went wrong, please try again later.';
		}),
		TE.fold<string, Room[], Props>(
			(error) => of({ error, rooms: [] }),
			(rooms: Room[]) => of({ error: undefined, rooms })
		)
	)();

type FormResult =
	| {
			success: true;
	  }
	| {
			success: false;
			error: string;
	  };

const commandInvocation = <L, R>(locals: App.Locals, handler: (user: User) => TaskEither<L, R>) =>
	pipe(
		TE.fromEither(locals.user),
		TE.flatMap(handler),
		TE.mapLeft((error) => {
			console.error(error);
			return 'Something went wrong, please try again later.';
		}),
		TE.fold<string, R, FormResult>(
			(error) => of({ success: false, error }),
			() => of({ success: true })
		)
	)();

export const actions = {
	create: async ({ locals }: RequestEvent) => commandInvocation(locals, Rooms.create),

	bots: async ({ locals, request }: RequestEvent): Promise<FormResult> =>
		commandInvocation(locals, (user) =>
			pipe(
				extractRoomId(request),
				TE.flatMap((roomId) => Rooms.addBot(user, roomId))
			)
		),

	join: async ({ locals, request }: RequestEvent): Promise<FormResult> =>
		commandInvocation(locals, (user) =>
			pipe(
				extractRoomId(request),
				TE.flatMap((roomId) => Rooms.join(user, roomId))
			)
		),

	launch: async ({ locals, request }: RequestEvent): Promise<FormResult> =>
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
