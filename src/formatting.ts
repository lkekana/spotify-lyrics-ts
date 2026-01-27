import type { SimplifiedArtist } from "@spotify/web-api-ts-sdk";
import type { LyricsResponse } from "./API.js";
import type { GQLTrack, TrackMetadata } from "./types.js";

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

export interface LRCMetadata {
	name: string;
	albumName: string;
	artist: string;
	duration_ms: number;
}

export function getArtistName(artists: SimplifiedArtist[]): string {
	return artists.map((artist) => artist.name).join(", ");
}

export function formatLrc(l: LyricsResponse, metadata: LRCMetadata): string {
	const lyrics = l.lyrics.lines;
	const durationSeconds = metadata.duration_ms / 1000;
	const minutes = Math.floor(durationSeconds / 60);
	const seconds = durationSeconds % 60;

	const lrc: string[] = [];
	if (metadata.name.length > 0) lrc.push(`[ti:${metadata.name}]`);
	if (metadata.albumName.length > 0) lrc.push(`[al:${metadata.albumName}]`);
	if (metadata.artist.length > 0) lrc.push(`[ar:${metadata.artist}]`);
	if (metadata.duration_ms > 0)
		lrc.push(
			`[length: ${minutes.toString().padStart(2, "0")}:${seconds
				.toFixed(2)
				.padStart(5, "0")}]`,
		);
	
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
