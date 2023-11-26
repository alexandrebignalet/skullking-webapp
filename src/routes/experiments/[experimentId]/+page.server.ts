import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import type { ServerLoadEvent } from '@sveltejs/kit';
import { queryInvocation } from '$lib/query-invocation';
import type { Experiment } from '$lib/domain/experiment';
import { Experiments } from '$lib/server/experiment/experiment.repository.server';
import * as O from 'fp-ts/lib/Option';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import { SkullKings } from '$lib/server/skullKing/skullKing.repository.server';
import type { SkullKing } from '$lib/domain/skullKing';
import type { TaskEither } from 'fp-ts/TaskEither';

type QueryResponse = {
	experiment?: Experiment;
	skullKing?: SkullKing;
	error?: string;
};

export const load = async ({ locals, params }: ServerLoadEvent): Promise<QueryResponse> =>
	pipe(
		loadExperiment(locals, params),
		TE.flatMapTask(loadExperimentSkullKing(locals)),
		T.flatMap((e) => T.of(E.isLeft(e) ? { error: e.left } : e.right))
	)();

function loadExperiment(
	locals: App.Locals,
	params: Partial<Record<string, string>>
): TaskEither<string, Experiment> {
	return queryInvocation('experiment', locals, (user) =>
		pipe(
			params.experimentId ? O.some(params.experimentId) : O.none,
			TE.fromOption(() => 'Experiement ID is missing'),
			TE.flatMap((experimentId) => Experiments.get(user, experimentId))
		)
	);
}

function loadExperimentSkullKing(locals: App.Locals) {
	return (experiment: Experiment) => {
		return pipe(
			TE.Do,
			TE.apS('experiment', TE.right(experiment)),
			TE.apS(
				'skullKing',
				queryInvocation('skullking', locals, (user) =>
					experiment.skullKingId
						? SkullKings.get(user, experiment.skullKingId)
						: TE.right(undefined)
				)
			),
			TE.fold<
				string,
				{
					experiment: Experiment;
					skullKing?: SkullKing;
				},
				QueryResponse
			>(
				(e) => T.of({ error: e }),
				({ experiment, skullKing }) => T.of({ experiment, skullKing })
			)
		);
	};
}
