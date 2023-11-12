import { z } from 'zod';

export const domainErrorSchema = z.object({
	message: z.string(),
	code: z.string()
});

export type DomainError = z.infer<typeof domainErrorSchema>;

export const isDomainError = (error: unknown): error is DomainError =>
	error !== null && typeof error === 'object' && 'message' in error && 'code' in error;
