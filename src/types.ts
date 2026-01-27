export type Session = {
	clientId: string;
	accessToken: string;
	accessTokenExpirationTimestampMs: number;
	isAnonymous: boolean;
	_notes: string;
	totpVerExpired: string;
	totpValidUntil: string;
};

export type Line = {
	startTimeMs: string;
	words: string;
	syllables: string[];
	endTimeMs: string;
};

export type LyricsResponse = {
	lyrics: {
		syncType: string;
		lines: Line[];
		provider: string;
		providerLyricsId: string;
		providerDisplayName: string;
		syncLyricsUri: string;
		isDenseTypeface: boolean;
		alternatives: string[];
		language: string;
		isRtlLanguage: boolean;
		capStatus: string;
		previewLines: Line[];
	};
	colors: {
		background: number;
		text: number;
		highlightText: number;
	};
	hasVocalRemoval: boolean;
};

export type ProfileAttributes = {
	data: {
		me: {
			profile: {
				avatar: { sources: Image[] };
				avatarBackgroundColor: number;
				name: string;
				uri: string;
				username: string;
			};
		};
	};
};

export interface Image {
	url: string;
	width: number;
	height: number;
}

export type MediaType = "AUDIO";
export type ArtistRole = "ARTIST_ROLE_MAIN_ARTIST";
export type ContentRatingTag = "CONTENT_RATING_TAG_EXPLICIT";
export type AudioFormat = "AUDIO_FORMAT_STEREO";

export interface ArtistData {
	gid: string;
	name: string;
	uri?: string;
}

export interface CoverGroupImage {
	file_id: string;
	size: string;
	width: number;
	height: number;
}

export interface Licensor {
	uuid: string;
}

export interface DateOnly {
	year: number;
	month: number;
	day: number;
}

export interface DateWithHour extends DateOnly {
	hour?: number;
}

export interface PrereleaseConfig {
	earliest_reveal_date: DateWithHour;
	earliest_coverart_reveal_date?: DateWithHour;
}

export interface OriginalAudio {
	uuid: string;
	format: AudioFormat;
}

export interface ArtistWithRole {
	artist_gid: string;
	artist_name: string;
	role: ArtistRole;
}

export interface TrackContentRating {
	tag: ContentRatingTag;
	markets: string[];
}

export interface ImplementationDetails {
	catalog_insertion_date: {
		seconds: number;
		nanos: number;
	};
}

export interface AudioFormatItem {
	original_audio: OriginalAudio;
}

export interface TrackMetadata {
	gid: string;
	name: string;
	album: {
		gid: string;
		name: string;
		artist: ArtistData[];
		label: string;
		date: {
			year: number;
			month: number;
			day: number;
			hour?: number;
		};
		cover_group: {
			image: CoverGroupImage[];
		};
		licensor?: Licensor;
		prerelease_config?: PrereleaseConfig;
	};
	artist: ArtistData[];
	number: number;
	duration: number;
	external_id: Array<{
		type: string;
		id: string;
	}>;
	disc_number?: number;
	popularity?: number;
	explicit?: boolean;
	earliest_live_timestamp?: number;
	has_lyrics?: boolean;
	licensor?: Licensor;
	language_of_performance?: string[];
	original_audio?: OriginalAudio;
	original_title?: string;
	artist_with_role?: ArtistWithRole[];
	canonical_uri?: string;
	prerelease_config?: PrereleaseConfig;
	content_authorization_attributes?: string;
	track_content_rating?: TrackContentRating[];
	audio_formats?: AudioFormatItem[];
	media_type?: MediaType;
	implementation_details?: ImplementationDetails;
}

// ---------------------------------------------

export interface ContentRating {
	label: string;
}

export interface Playability {
	playable: boolean;
	reason?: string;
}

export interface SharingInfo {
	shareUrl: string;
	shareId: string;
}

export interface ArtistVisuals {
	avatarImage: {
		sources: Image[];
	};
}

export interface GQLArtistWithRole {
	role: string;
	artist: {
		id: string;
		uri: string;
		visuals: ArtistVisuals;
		profile: { name: string };
		discography?: Discography;
	};
}

export interface CopyrightItem {
	text: string;
	type: string;
}

export interface CoverArt {
	extractedColors?: {
		colorRaw?: {
			hex: string;
		};
	};
	sources: Image[];
}

export interface ReleaseTrackItem {
	track: {
		uri: string;
		trackNumber: number;
	};
}

export interface ReleaseTracks {
	totalCount: number;
	items: ReleaseTrackItem[];
}

export interface ReleaseDate {
	isoString: string;
	precision: string;
	year: number;
}

export interface ReleasePlayability {
	playable: boolean;
}

export interface ReleaseItem {
	name: string;
	type: string;
	uri: string;
	playability: ReleasePlayability;
	date: ReleaseDate;
	tracks: ReleaseTracks;
	coverArt: CoverArt;
}

export interface Releases {
	items: ReleaseItem[];
}

export interface DiscographyItem {
	releases: Releases;
}

export interface DiscographySection {
	totalCount: number;
	items: DiscographyItem[];
}

export interface PopularReleaseTrack {
	artists: Array<{
		uri: string;
		profile: {
			name: string;
		};
	}>;
	albumOfTrack: {
		name: string;
		uri: string;
		coverArt: CoverArt;
	};
	playability: ReleasePlayability;
	playcount: string;
	previews: {
		audioPreviews: {
			items: Array<{
				url: string;
			}>;
		};
	};
	duration: {
		totalMilliseconds: number;
	};
	name: string;
	uri: string;
	id: string;
}

export interface TopTracks {
	items: Array<{
		track: PopularReleaseTrack;
	}>;
}

export interface PopularReleasesAlbumItem {
	name: string;
	type: string;
	uri: string;
	playability: ReleasePlayability;
	date: ReleaseDate;
	tracks: ReleaseTracks;
	coverArt: CoverArt;
}

export interface PopularReleasesAlbums {
	items: PopularReleasesAlbumItem[];
}

export interface Discography {
	singles: DiscographySection;
	albums: DiscographySection;
	popularReleasesAlbums: PopularReleasesAlbums;
	topTracks: TopTracks;
}

export type GQLTrack = {
	data: {
		trackUnion: {
			__typename: string;
			duration: {
				totalMilliseconds: number;
			};
			id: string;
			name: string;
			trackNumber: number;
			uri: string;
			contentRating?: ContentRating;
			playability?: Playability;
			playcount?: string;
			saved?: boolean;
			sharingInfo?: SharingInfo;
			artistsWithRoles?: {
				totalCount: number;
				items: GQLArtistWithRole[];
			};
			albumOfTrack: {
				id?: string;
				copyright: {
					totalCount?: number;
					items: CopyrightItem[];
				};
				courtesyLine?: string;
				date: {
					isoString: string;
					precision: string;
					year: number;
				};
				name: string;
				type?: string;
				uri: string;
				playability?: Playability;
				tracks: {
					totalCount: number;
					items?: Array<{
						track: {
							uri: string;
							trackNumber: number;
						};
					}>;
				};
				coverArt: CoverArt;
			};
		};
	};
};
