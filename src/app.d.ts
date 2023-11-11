// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { User, UserError } from "$lib/server/user/user";
import type { Either } from "fp-ts/Either";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: Either<UserError, User>;
		}

		// interface PageData {}
		// interface Platform {}
	}
}

export {};
