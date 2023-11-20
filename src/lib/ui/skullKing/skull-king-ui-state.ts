import type { SkullKing } from '$lib/domain/skullKing';
import { skullKingPhases } from '$lib/domain/skullKing';
import type { ValuesOf } from '$lib/server/utils';
import type { CardPlayed, SkullKingEvent } from '$lib/domain/events';
import { isCardPlayed, isFoldSettled } from '$lib/domain/events';

export const animationTimeouts = {
	CARD_PLAYED: 500,
	ANNOUNCEMENT: 2500,
	ROUND_FINISHED: 2500,
	FOLD_SETTLED: 1000
} as const;

export type AnimationTimeout = { [key in keyof typeof animationTimeouts]: number };

export const skullKingUiStateTransitions = {
	ANNOUNCE: 'ANNOUNCE',
	YO_HO_HO: 'YO_HO_HO',
	PLAY_CARDS: 'PLAY_CARDS',
	SHOW_ROUND_SCORE: 'SHOW_ROUND_SCORE'
} as const;
type SkullKingUiStateTransition = ValuesOf<typeof skullKingUiStateTransitions>;

export const resolveSkullKingUiStateTransition = (
	{ phase: previousPhase }: SkullKing,
	{ phase: nextPhase }: SkullKing
): SkullKingUiStateTransition => {
	switch (previousPhase) {
		case skullKingPhases.ANNOUNCEMENT:
			return nextPhase === skullKingPhases.CARDS
				? skullKingUiStateTransitions.YO_HO_HO
				: skullKingUiStateTransitions.ANNOUNCE;

		case skullKingPhases.CARDS:
			return nextPhase === skullKingPhases.CARDS
				? skullKingUiStateTransitions.PLAY_CARDS
				: skullKingUiStateTransitions.SHOW_ROUND_SCORE;
	}
};

type UiStateReducer = {
	reducer: (previousUiState: SkullKing, newRemoteState: SkullKing) => SkullKing;
	timeout: number;
};

type UiStateReducerBuilder = (
	eventsCollected: SkullKingEvent[],
	timeouts: AnimationTimeout
) => UiStateReducer[];

export const skullKingUiStateReducerBuildersByTransition: {
	[key in SkullKingUiStateTransition]: UiStateReducerBuilder;
} = {
	[skullKingUiStateTransitions.ANNOUNCE]: () => [],
	[skullKingUiStateTransitions.YO_HO_HO]: yoHoHoReducerBuilder,
	[skullKingUiStateTransitions.PLAY_CARDS]: cardPlayReducerBuilder,
	[skullKingUiStateTransitions.SHOW_ROUND_SCORE]: roundFinishedReducersBuilder
} as const;

function yoHoHoReducerBuilder(
	eventsCollected: SkullKingEvent[],
	timeouts: AnimationTimeout
): UiStateReducer[] {
	const animationTimeReducer: UiStateReducer = {
		timeout: timeouts.ANNOUNCEMENT,
		reducer: (_, newRemoteState) => ({ ...newRemoteState, fold: [] })
	};

	if (eventsCollected.length === 0) {
		return [animationTimeReducer];
	}

	const [currentFoldEvents] = extractEvents(eventsCollected);
	const cardPlayedEvents: CardPlayed[] = currentFoldEvents.filter(isCardPlayed);
	const cardPlayedReducers = cardPlayedEvents.map((cardPlayed) => ({
		reducer: (previousState: SkullKing) => cardPlayedReducer(cardPlayed, previousState),
		timeout: timeouts.CARD_PLAYED
	}));

	return [animationTimeReducer].concat(cardPlayedReducers);
}

function roundFinishedReducersBuilder(
	eventsCollected: SkullKingEvent[],
	timeouts: AnimationTimeout
): UiStateReducer[] {
	const roundFinishedReducer: UiStateReducer = {
		timeout: timeouts.ROUND_FINISHED,
		reducer: (_: SkullKing, newRemoteState: SkullKing) => newRemoteState
	};

	const [currentFoldEvents] = extractEvents(eventsCollected);
	const cardPlayedEvents: CardPlayed[] = currentFoldEvents.filter(isCardPlayed);
	const cardPlayedReducers: UiStateReducer[] = cardPlayedEvents.map((cardPlayed) => ({
		reducer: (previousState: SkullKing) => cardPlayedReducer(cardPlayed, previousState),
		timeout: timeouts.CARD_PLAYED
	}));

	return cardPlayedReducers.concat(roundFinishedReducer);
}

function cardPlayReducerBuilder(
	eventsCollected: SkullKingEvent[],
	timeouts: AnimationTimeout
): UiStateReducer[] {
	const [currentFoldEvents, nextFoldEvents] = extractEvents(eventsCollected);

	const cardPlayedEvents: CardPlayed[] = currentFoldEvents.filter(isCardPlayed);
	const cardPlayedReducers: UiStateReducer[] = cardPlayedEvents.map((cardPlayed) => ({
		reducer: (previousState: SkullKing) => cardPlayedReducer(cardPlayed, previousState),
		timeout: timeouts.CARD_PLAYED
	}));
	const foldSettledEvents = currentFoldEvents.filter(isFoldSettled);
	const foldSettledReducers: UiStateReducer[] =
		foldSettledEvents.length === 0
			? []
			: [{ reducer: (_, newRemoteState) => ({ ...newRemoteState, fold: [] }), timeout: 1000 }];

	const nextFoldCardPlayedEvents: CardPlayed[] = nextFoldEvents.filter(isCardPlayed);
	const nextFoldCardPlayedReducers: UiStateReducer[] = nextFoldCardPlayedEvents.map(
		(cardPlayed) => ({
			reducer: (previousUiState: SkullKing) => cardPlayedReducer(cardPlayed, previousUiState),
			timeout: timeouts.CARD_PLAYED
		})
	);

	return cardPlayedReducers.concat(foldSettledReducers).concat(nextFoldCardPlayedReducers);
}

function cardPlayedReducer(cardPlayed: CardPlayed, baseStateToApplyOn: SkullKing) {
	return {
		...baseStateToApplyOn,
		fold: baseStateToApplyOn.fold.concat(cardPlayed),
		players: baseStateToApplyOn.players.map((player) =>
			player.id === cardPlayed.playerId
				? { ...player, cardIds: player.cardIds.filter((c) => c !== cardPlayed.cardId) }
				: player
		)
	};
}

function extractEvents(events: SkullKingEvent[]): [SkullKingEvent[], SkullKingEvent[]] {
	const eventsCollectedSorted = events.sort((a, b) => a.version - b.version);
	const foldSettledIndex = eventsCollectedSorted.findIndex(isFoldSettled);
	const currentFoldEvents =
		foldSettledIndex === -1
			? eventsCollectedSorted
			: eventsCollectedSorted.slice(0, foldSettledIndex + 1);
	const nextFoldEvents =
		foldSettledIndex === -1
			? []
			: eventsCollectedSorted.slice(foldSettledIndex, eventsCollectedSorted.length);

	return [currentFoldEvents, nextFoldEvents];
}
