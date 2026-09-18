export type MusicLinkProvider = "spotify" | "apple-music";

export type MusicLinkMetadata = {
  provider: MusicLinkProvider;
  title: string;
  artist: string;
  album: string;
  url: string;
  artworkUrl?: string;
};

export function detectMusicLinkProvider(
  value: string,
): MusicLinkProvider | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();

    if (
      host === "open.spotify.com" ||
      host === "spotify.link" ||
      host.endsWith(".spotify.com")
    ) {
      return "spotify";
    }

    if (
      host === "music.apple.com" ||
      host.endsWith(".music.apple.com")
    ) {
      return "apple-music";
    }

    return null;
  } catch {
    return null;
  }
}

export function isSupportedMusicLink(value: string) {
  return detectMusicLinkProvider(value) !== null;
}
