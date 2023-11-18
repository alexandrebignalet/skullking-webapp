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
		type: z.literal(eventTypes.GAME_FINISHED)
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
		type: z.literal(eventTypes.CARD_PLAYED)
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
		type: z.literal(eventTypes.FOLD_SETTLED)
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
		type: z.literal(eventTypes.PLAYER_ANNOUNCED)
	})
	.transform(({ gameId, ...rest }) => ({
		skullId: gameId,
		...rest
	}));

const roundFinished = z
	.object({
		gameId: z.string(),
		roundNb: z.number(),
		type: z.literal(eventTypes.ROUND_FINISHED)
	})
	.transform(({ gameId, ...rest }) => ({
		skullId: gameId,
		...rest
	}));

const gameFinished = z.object({
	type: z.literal(eventTypes.GAME_FINISHED)
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
