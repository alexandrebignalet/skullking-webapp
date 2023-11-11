import { z } from 'zod';
import type { User } from '$lib/server/user/user';

const gameUserTypes = {
	REAL: 'REAL',
	BOT: 'BOT'
} as const;

const gameUserSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.nativeEnum(gameUserTypes)
});

export const gameRoomSchema = z.object({
	id: z.string(),
	creator: z.string(),
	users: z.array(gameUserSchema),
	gameId: z.string().nullable(),
	creationDate: z.number(),
	updateDate: z.number(),
	configuration: z.unknown().nullable(),
	isStarted: z.boolean(),
	isFull: z.boolean()
});

export type Room = z.infer<typeof gameRoomSchema>;

const isInRoom = (user: User, room: Room) => room.users.some((roomUser) => roomUser.id === user.id);
const isCreator = (user: User, room: Room) => room.creator === user.id;

export { isInRoom, isCreator };
