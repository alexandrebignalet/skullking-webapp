import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import type { ServerLoadEvent } from '@sveltejs/kit';
import { of } from 'fp-ts/lib/Task';
import { queryInvocation } from '$lib/query-invocation';
import type { Experiment } from '$lib/domain/experiment';
import { Experiments } from '$lib/server/experiment/experiment.repository.server';

type QueryResponse = {
	experiments: Experiment[];
	error?: string;
};
export const load = async ({ locals }: ServerLoadEvent): Promise<QueryResponse> =>
	pipe(
		queryInvocation('experiment', locals, Experiments.list),
		TE.fold<string, Experiment[], QueryResponse>(
			(error) => of({ experiments: [], error }),
			(experiments: Experiment[]) => of({ experiments, error: undefined })
		)
	)();
