import { z } from 'zod';

const eventTypes = {
	GAME_STARTED: 'game_started',
	PLAYER_ANNOUNCED: 'player_announced',
	CARD_PLAYED: 'card_played',
	FOLD_SETTLED: 'fold_settled',
	ROUND_FINISHED: 'round_finished',
	GAME_FINISHED: 'game_finished'
} as const;

const gameStarted = z
	.object({
		gameId: z.string(),
		type: z.literal(eventTypes.GAME_FINISHED),
		version: z.number()
	})
	.transform(({ gameId, ...rest }) => ({ skullId: gameId, ...rest }));

const cardPlayed = z
	.object({
		gameId: z.string(),
		playerId: z.string(),
		card: z.object({
			id: z.string()
		}),
		isLastFoldPlay: z.boolean(),
		type: z.literal(eventTypes.CARD_PLAYED),
		version: z.number()
	})
	.transform(({ gameId, card, ...rest }) => ({
		skullId: gameId,
		cardId: card.id,
		...rest
	}));

const foldSettled = z
	.object({
		gameId: z.string(),
		winnerPlayerId: z.string(),
		bonus: z.number(),
		won: z.boolean(),
		type: z.literal(eventTypes.FOLD_SETTLED),
		version: z.number()
	})
	.transform(({ gameId, ...rest }) => ({
		skullId: gameId,
		...rest
	}));

const playerAnnounced = z
	.object({
		gameId: z.string(),
		playerId: z.string(),
		roundNb: z.number(),
		announce: z.number(),
		isLast: z.boolean(),
		type: z.literal(eventTypes.PLAYER_ANNOUNCED),
		version: z.number()
	})
	.transform(({ gameId, ...rest }) => ({
		skullId: gameId,
		...rest
	}));

const roundFinished = z
	.object({
		gameId: z.string(),
		roundNb: z.number(),
		type: z.literal(eventTypes.ROUND_FINISHED),
		version: z.number()
	})
	.transform(({ gameId, ...rest }) => ({
		skullId: gameId,
		...rest
	}));

const gameFinished = z.object({
	type: z.literal(eventTypes.GAME_FINISHED),
	version: z.number()
});

export const skullKingEventSchema = z.union([
	gameStarted,
	cardPlayed,
	foldSettled,
	playerAnnounced,
	roundFinished,
	gameFinished
]);
export type SkullKingEvent = z.infer<typeof skullKingEventSchema>;

export type CardPlayed = z.infer<typeof cardPlayed>;
export const isCardPlayed = (e: SkullKingEvent): e is CardPlayed => e.type === 'card_played';

export type FoldSettled = z.infer<typeof foldSettled>;
export const isFoldSettled = (e: SkullKingEvent): e is FoldSettled => e.type === 'fold_settled';
