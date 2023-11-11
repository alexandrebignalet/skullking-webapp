import { describe, expect, it } from 'vitest';
import { validateBackendCookie } from '$lib/server/authentication/authentication';

describe('authentication', () => {
	it('backend cookie validation', () => {
		expect(validateBackendCookie('usr_2Y1RoK25afewdHMpZOwQSSGeyvf:franck', 'franck')).toBeTruthy();
	});
});
