import { z } from 'zod';

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
