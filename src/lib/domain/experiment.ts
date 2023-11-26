import { z } from 'zod';

const experimentWinner = z.object({
	playerId: z.string(),
	name: z.string(),
	score: z.number()
});

export const experimentSchema = z.object({
	id: z.string(),
	playersCount: z.number(),
	botRepartition: z.record(z.number()),
	skullKingId: z.string().nullable(),
	createdAt: z.string()
});

export type Experiment = z.infer<typeof experimentSchema>;
