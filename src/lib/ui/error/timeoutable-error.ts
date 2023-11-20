export type TimeoutableError = {
	id: number;
	message: string;
};
export const timeoutableError = (error: string) => ({ id: new Date().getTime(), message: error });
