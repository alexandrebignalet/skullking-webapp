import { writable } from 'svelte/store';
import type { TimeoutableError } from '$lib/ui/error/timeoutable-error';
import { timeoutableError } from '$lib/ui/error/timeoutable-error';
import type { DomainError } from '$lib/domain/domain-error';
import { isDomainError } from '$lib/domain/domain-error';

export function errorStore(subscribeFn: (e: TimeoutableError[]) => void) {
	const errorStore = writable<TimeoutableError[]>([]);

	const unsubscribe = errorStore.subscribe(subscribeFn);
	const pushError = (error: string | DomainError) => {
		const err = timeoutableError(isDomainError(error) ? error.message : 'Something went wrong');
		errorStore.update((actual) => actual.concat(err));
		window.setTimeout(() => {
			errorStore.update((actual) => actual.filter((e) => e.id !== err.id));
		}, 5000);
	};

	return {
		pushError,
		unsubscribe
	};
}
