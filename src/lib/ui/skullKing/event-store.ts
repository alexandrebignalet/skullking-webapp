import type { SkullKingEvent } from '$lib/domain/events';
import { writable } from 'svelte/store';

export function eventStore(subscribe: (s: { events: SkullKingEvent[] }) => void) {
	const store = writable<{
		collectionEnabled: boolean;
		events: SkullKingEvent[];
	}>({ collectionEnabled: false, events: [] });
	const stopEventsCollection = () => store.update((s) => ({ ...s, collectionEnabled: false }));
	const startEventsCollection = () => store.set({ collectionEnabled: true, events: [] });
	const collectEvent = (event: SkullKingEvent) =>
		store.update((s) => (s.collectionEnabled ? { ...s, events: s.events.concat(event) } : s));
	const unsubscribe = store.subscribe(subscribe);

	return {
		startEventsCollection,
		stopEventsCollection,
		collectEvent,
		unsubscribe
	};
}
