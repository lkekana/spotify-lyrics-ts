import type { SimplifiedArtist, Track } from "@spotify/web-api-ts-sdk";
import type { LyricsResponse } from "./API.js";

interface TrackData {
	name: string;
	album_name: string;
	artist: string;
	duration_ms: number;
}

interface LyricsLine {
	startTimeMs?: string;
	words: string;
}

interface LyricsJson {
	lyrics: {
		lines: LyricsLine[];
		syncType: string;
	};
}

export function getArtistName(artists: SimplifiedArtist[]): string {
	return artists.map((artist) => artist.name).join(", ");
}

export function formatLrc(l: LyricsResponse, trackData: Track): string {
	const lyrics = l.lyrics.lines;
	const durationSeconds = trackData.duration_ms / 1000;
	const minutes = Math.floor(durationSeconds / 60);
	const seconds = durationSeconds % 60;

	const lrc: string[] = [
		`[ti:${trackData.name}]`,
		`[al:${trackData.album.name}]`,
		`[ar:${getArtistName(trackData.artists)}]`,
		`[length: ${minutes.toString().padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}]`,
	];

	for (const line of lyrics) {
		if (l.lyrics.syncType === "UNSYNCED") {
			lrc.push(line.words);
		} else if (line.startTimeMs) {
			const startTimeMs = Number.parseInt(line.startTimeMs, 10);
			const lineMinutes = Math.floor(startTimeMs / 1000 / 60);
			const lineSeconds = (startTimeMs / 1000) % 60;
			lrc.push(
				`[${lineMinutes.toString().padStart(2, "0")}:${lineSeconds.toFixed(2).padStart(5, "0")}] ${line.words}`,
			);
		}
	}

	return lrc.join("\n");
}
