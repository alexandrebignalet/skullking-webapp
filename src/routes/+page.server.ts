import { Rooms } from '$lib/server/room/room.repository.server';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import type { Room } from '$lib/domain/room';
import { of } from 'fp-ts/lib/Task';
import { queryInvocation } from '$lib/query-invocation';
import { commandInvocation } from '$lib/command-invocation';
import type { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

type QueryResponse = {
	rooms: Room[];
	error?: string;
};
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
				extractAddBotRequest(request),
				TE.flatMap(({ roomId, strategy }) => Rooms.addBot(user, roomId, strategy))
			)
		),

	join: async ({ locals, request }: RequestEvent) =>
		commandInvocation('join', locals, (user) =>
			pipe(
				extractFormData(request),
				TE.flatMapEither((formData) => extractRoomId(formData)),
				TE.flatMap((roomId) => Rooms.join(user, roomId))
			)
		),

	launch: async ({ locals, request }: RequestEvent) =>
		commandInvocation('launch', locals, (user) =>
			pipe(
				extractFormData(request),
				TE.flatMapEither((formData) => extractRoomId(formData)),
				TE.flatMap((roomId) => Rooms.launch(user, roomId))
			)
		)
};

function extractFormData(request: Request) {
	return TE.tryCatch(
		() => request.formData(),
		(error) => {
			console.error(error);
			return `Could not parse form data; ${error} ${JSON.stringify(request)}`;
		}
	);
}

const extractAddBotRequest = (request: Request) => {
	return pipe(
		extractFormData(request),
		TE.flatMapEither((formData) =>
			pipe(
				E.Do,
				E.apS('roomId', extractRoomId(formData)),
				E.apS('strategy', extractStrategy(formData))
			)
		)
	);
};

const extractStrategy = (formData: FormData): Either<string, string> => {
	const formValue = formData.get('strategy');
	return !!formValue && typeof formValue === 'string'
		? E.right(formValue)
		: E.left(`Could not parse strategy from form data; ${formValue}`);
};

const extractRoomId = (formData: FormData): Either<string, string> => {
	const formValue = formData.get('roomId');
	return !!formValue && typeof formValue === 'string'
		? E.right(formValue)
		: E.left(`Could not parse roomId from form data; ${formValue}`);
};
