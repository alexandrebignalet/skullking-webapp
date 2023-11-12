import { z } from 'zod';
import type { ValuesOf } from '$lib/server/utils';

export const skullKingPhases = {
	ANNOUNCEMENT: 'ANNOUNCEMENT',
	CARDS: 'CARDS'
} as const;

export const cardTypes = {
	ESCAPE: 'ESCAPE',
	MERMAID: 'MERMAID',
	COLORED: 'COLORED',
	PIRATE: 'PIRATE',
	SCARY_MARY: 'SCARY_MARY',
	SKULLKING: 'SKULLKING',
	KRAKEN: 'KRAKEN',
	WHITE_WHALE: 'WHITE_WHALE',
	BUTIN: 'BUTIN'
} as const;

export const scaryMaryUsages = {
	[cardTypes.PIRATE]: cardTypes.PIRATE,
	[cardTypes.ESCAPE]: cardTypes.ESCAPE,
	NOT_SET: 'NOT_SET'
} as const;

export type ScaryMaryUsage = ValuesOf<typeof scaryMaryUsages>;

export const card = z.object({
	id: z.string().nullable(),
	type: z.nativeEnum(cardTypes),
	value: z.number().nullable(),
	color: z.string().nullable(),
	usage: z.string().nullable(),
	name: z.string().nullable()
});

const playerId = z.string();
const roundNb = z.number();

export const player = z.object({
	id: playerId,
	name: z.string(),
	gameId: z.string(),
	cards: z.array(card)
});

export const play = z.object({
	playerId,
	card: card
});

export const roundScore = z.object({
	announced: z.number(),
	done: z.number(),
	potentialBonus: z.number(),
	roundNb,
	score: z.number()
});

export const skullKingSchema = z.object({
	id: z.string(),
	players: z.array(player),
	roundNb,
	fold: z.array(play),
	isEnded: z.boolean(),
	phase: z.nativeEnum(skullKingPhases),
	currentPlayerId: playerId,
	scoreBoard: z.record(z.array(roundScore))
});

export type SkullKing = z.infer<typeof skullKingSchema>;
