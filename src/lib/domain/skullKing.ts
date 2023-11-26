import { z } from 'zod';
import type { ValuesOf } from '$lib/server/utils';

export const skullKingPhases = {
	ANNOUNCEMENT: 'ANNOUNCEMENT',
	CARDS: 'CARDS'
} as const;

export const scaryMaryUsages = {
	PIRATE: 'PIRATE',
	ESCAPE: 'ESCAPE',
	NOT_SET: 'NOT_SET'
} as const;

export type ScaryMaryUsage = ValuesOf<typeof scaryMaryUsages>;

export const card = z
	.object({
		id: z.string()
	})
	.transform(({ id }) => id);

const playerId = z.string();
const roundNb = z.number();

export const player = z
	.object({
		id: playerId,
		name: z.string(),
		gameId: z.string(),
		cards: z.array(card)
	})
	.transform(({ cards, ...rest }) => ({ cardIds: cards, ...rest }));

export const play = z
	.object({
		playerId,
		card
	})
	.transform(({ card, playerId }) => ({ cardId: card, playerId }));

export const roundScore = z.object({
	announced: z.number(),
	done: z.number(),
	potentialBonus: z.number(),
	roundNb,
	score: z.number()
});

const skullKingId = z.string();
export type SkullKingId = z.infer<typeof skullKingId>;

export const skullKingSchema = z.object({
	id: skullKingId,
	players: z.array(player),
	roundNb,
	fold: z.array(play),
	isEnded: z.boolean(),
	phase: z.nativeEnum(skullKingPhases),
	currentPlayerId: playerId,
	scoreBoard: z.record(z.array(roundScore))
});

export type SkullKing = z.infer<typeof skullKingSchema>;

type Winner = {
	playerId: string;
	score: number;
	name: string;
};

export const winner = (skullKing: SkullKing): Winner => {
	const winner = Object.entries(skullKing.scoreBoard)
		.map(([playerId, scores]) => ({
			playerId,
			score: scores.reduce((acc, score) => acc + score.score, 0)
		}))
		.reduce((acc, score) => (acc.score > score.score ? acc : score), { playerId: '', score: 0 });

	return {
		...winner,
		name: skullKing.players.find((player) => player.id === winner.playerId)?.name ?? ''
	};
};
