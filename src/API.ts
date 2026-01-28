import { generate } from "./TOTP.js";
import { NotValidSpDcError, TOTPGenerationError } from "./error.js";
import { SERVER_TIME_URL, SpotifyClient, TOKEN_URL } from "./extract.js";
import { formatLrc } from "./formatting.js";
import type {
	GQLTrack,
	LyricsResponse,
	ProfileAttributes,
	Session,
	TrackMetadata,
} from "./types.js";

const SP_BASE62 =
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const profileAttributesHash =
	"53bcb064f6cd18c23f752bc324a791194d20df612d8e1239c735144ab0399ced";
const getTrackHash =
	"612585ae06ba435ad26369870deaae23b5c8800a256cd8a57e08eddc25a37294";

export class Spotify {
	private token: string | undefined = undefined;
	private dcToken: string;
	private useLatestClientInfo: boolean;
	private client: SpotifyClient;
	public sessionInfo: Session | undefined = undefined;

	constructor(dcToken: string, useLatestClientInfo = false) {
		this.dcToken = dcToken;
		this.useLatestClientInfo = useLatestClientInfo;
		this.client = new SpotifyClient();
	}

	async initialize(): Promise<void> {
		await this.login();
		if (this.useLatestClientInfo) {
			await this.client.getSession();
		}
	}

	private async fetchWithHeaders(
		url: string,
		options: RequestInit = {},
		includeBearer = false,
	): Promise<Response> {
		const apiHeaders = await this.client.getAPIHeaders(
			this.useLatestClientInfo,
		);
		let headers = {
			...apiHeaders,
			Cookie: `sp_dc=${this.dcToken}`,
			...(options.headers || {}),
		};

		if (includeBearer) {
			if (!this.token) {
				throw new Error(
					"Token is not initialized. Call login() first.",
				);
			}
			const newHeaders = {
				...headers,
				Authorization: `Bearer ${this.token}`,
			};
			headers = newHeaders;
		}

		return fetch(url, { ...options, headers });
	}

	private async login(): Promise<Session> {
		try {
			const serverTimeResponse =
				await this.fetchWithHeaders(SERVER_TIME_URL);
			const serverTime =
				1e3 * (await serverTimeResponse.json()).serverTime;
			console.log(`server time: ${serverTime}`);
			const {
				totp,
				VERSION: version,
			}: { totp: string; VERSION: number } = await generate(serverTime);
			console.log(`totp: ${totp}, version: ${version}`);

			const params = new URLSearchParams({
				reason: "init",
				productType: "web-player",
				totp: totp,
				totpVer: version.toString(),
				ts: serverTime.toString(),
			});

			const tokenResponse = await this.fetchWithHeaders(
				`${TOKEN_URL}?${params.toString()}`,
			);
			const tokenResponseJSON = await tokenResponse.json();
			console.log(`token response: ${tokenResponseJSON}`);
			const tokenData: Session = tokenResponseJSON as Session;
			this.sessionInfo = tokenData;
			this.token = tokenData.accessToken;
			return tokenData;
		} catch (error) {
			if (error instanceof Error && error.message.includes("TOTP")) {
				throw new TOTPGenerationError(
					"Error generating TOTP, please retry!",
				);
			}
			throw new NotValidSpDcError(
				"sp_dc provided is invalid, please check it again!",
			);
		}
	}

	// refresh session if needed
	public async refreshSession(): Promise<Session> {
		if (
			!this.sessionInfo ||
			Date.now() >= this.sessionInfo.accessTokenExpirationTimestampMs
		) {
			try {
				this.sessionInfo = await this.login();
			} catch (error) {
				if (
					error instanceof NotValidSpDcError ||
					error instanceof TOTPGenerationError
				) {
					throw error;
				}
				throw new Error(
					"An unexpected error occurred while refreshing the session.",
				);
			}
		}
		return this.sessionInfo;
	}

	async getMe(): Promise<ProfileAttributes> {
		await this.refreshSession();
		const resp = await this.fetchWithHeaders(
			"https://api-partner.spotify.com/pathfinder/v2/query",
			{
				method: "POST",
				body: JSON.stringify({
					operationName: "profileAttributes",
					variables: {},
					extensions: {
						persistedQuery: {
							version: 1,
							sha256Hash: this.useLatestClientInfo
								? await this.client.partHash(
										"profileAttributes",
									)
								: profileAttributesHash,
						},
					},
				}),
			},
			true,
		);
		if (!resp.ok) {
			throw new Error(`HTTP error! status: ${resp.status}`);
		}
		const respObj: ProfileAttributes = await resp.json();
		return respObj;
	}

	async getTrack(trackId: string): Promise<TrackMetadata | null> {
		const hexId = spIdToHex(trackId);
		const params = "market=from_token";
		await this.refreshSession();
		try {
			const response = await this.fetchWithHeaders(
				`https://spclient.wg.spotify.com/metadata/4/track/${hexId}?${params}`,
				{},
				true,
			);
			if (response.status === 200) {
				return (await response.json()) as TrackMetadata;
			}
			return null;
		} catch (error) {
			console.warn(`Failed to fetch track data for track ID: ${trackId}`);
			console.error(error);
			return null;
		}
	}

	async getGQLTrack(trackId: string): Promise<GQLTrack | null> {
		await this.refreshSession();
		const resp = await this.fetchWithHeaders(
			"https://api-partner.spotify.com/pathfinder/v2/query",
			{
				method: "POST",
				body: JSON.stringify({
					operationName: "getTrack",
					variables: {
						uri: `spotify:track:${trackId}`,
					},
					extensions: {
						persistedQuery: {
							version: 1,
							sha256Hash: this.useLatestClientInfo
								? await this.client.partHash("getTrack")
								: getTrackHash,
						},
					},
				}),
			},
			true,
		);
		if (!resp.ok) {
			throw new Error(`HTTP error! status: ${resp.status}`);
		}
		const respObj: GQLTrack = await resp.json();
		return respObj;
	}

	async getLyrics(trackId: string): Promise<LyricsResponse | null> {
		const params = "format=json&market=from_token";
		await this.refreshSession();
		try {
			const response = await this.fetchWithHeaders(
				`https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?${params}`,
				{},
				true,
			);
			if (response.status === 200) {
				return await response.json();
			}
			return null;
		} catch (error) {
			console.warn(`Failed to fetch lyrics for track ID: ${trackId}`);
			console.error(error);
			return null;
		}
	}

	async getLyricsLRC(trackId: string): Promise<string | null> {
		const lyricsResponse = await this.getLyrics(trackId);
		if (lyricsResponse === null) {
			console.warn(`No lyrics found for track ID: ${trackId}`);
			return null;
		}
		// converting to hex is like 90% accurate in Javascript (for some reason) so we use the GQL method as a fallback
		let trackData: TrackMetadata | GQLTrack | null =
			await this.getTrack(trackId);
		if (trackData !== null) {
			return formatLrc(lyricsResponse, {
				name: trackData.name,
				albumName: trackData.album.name,
				artist: trackData.artist.map((a) => a.name).join(", "),
				duration_ms: trackData.duration,
			});
		}
		trackData = await this.getGQLTrack(trackId);
		if (trackData !== null) {
			return formatLrc(lyricsResponse, {
				name: trackData.data.trackUnion.name,
				albumName: "", // not included in GQL track data
				artist: trackData.data.trackUnion.artistsWithRoles
					? trackData.data.trackUnion.artistsWithRoles.items
							.map((a) => a.artist.profile.name)
							.join(", ")
					: "",
				duration_ms:
					trackData.data.trackUnion.duration.totalMilliseconds,
			});
		}
		throw new Error(
			`Failed to retrieve track metadata for track ID: ${trackId}`,
		);
	}
}

/**
 * Converts a Spotify Base62 ID to a 32-character hex string.
 */
function spIdToHex(spotifyId: string): string {
	// Build lookup map
	const dict = new Map<string, bigint>();
	for (let i = 0; i < SP_BASE62.length; i++) {
		const s = SP_BASE62[i];
		if (s === undefined) {
			throw new Error(`Invalid character at index ${i} in SP_BASE62`);
		}
		dict.set(s, BigInt(i));
	}

	let result = 0n;
	const base = 62n;

	for (let i = 0; i < spotifyId.length; i++) {
		const ch = spotifyId[i];
		if (ch === undefined) {
			throw new Error(`Invalid character at index ${i} in spotifyId`);
		}
		const val = dict.get(ch);
		if (val === undefined) {
			throw new Error(`Invalid Base62 character: ${ch}`);
		}
		result = result * base + val;
	}

	// Convert to hex and pad to 32 chars
	let hex = result.toString(16);
	if (hex.length > 32) {
		// Should not typically happen, but keep consistent behavior
		hex = hex.slice(-32);
	}
	return hex.padStart(32, "0");
}
