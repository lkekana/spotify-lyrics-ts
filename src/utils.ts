// source: https://github.com/zackey1514/spotify-genre-search/blob/9bc0cfd336177c4df6071f0f30666efbbde8ab17/src/util/util.ts

type LimitRange =
	| 0
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15
	| 16
	| 17
	| 18
	| 19
	| 20
	| 21
	| 22
	| 23
	| 24
	| 25
	| 26
	| 27
	| 28
	| 29
	| 30
	| 31
	| 32
	| 33
	| 34
	| 35
	| 36
	| 37
	| 38
	| 39
	| 40
	| 41
	| 42
	| 43
	| 44
	| 45
	| 46
	| 47
	| 48
	| 49
	| 50;

/**
 * Print object as a pretty JSON string.
 *
 * @param json A JavaScript value, usually an object or array, to be converted.
 */
export const prettyJson = (value: object) => JSON.stringify(value, null, "  ");

export const convertOffset = (str: string | undefined): number | undefined => {
	return typeof str === "string" ? Number(str) : str;
};

export const convertLimit = (
	str: string | undefined,
): LimitRange | undefined => {
	const limit = Number(str);
	if (isLimit(limit)) {
		return limit;
	}
};

const isLimit = (num: number): num is LimitRange => {
	return num < 51;
};
