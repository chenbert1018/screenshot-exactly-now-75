import { createServerFn } from "@tanstack/react-start";
import {
  detectMusicLinkProvider,
  type MusicLinkMetadata,
} from "./music-link-metadata";

type SpotifyOEmbed = {
  title?: string;
  thumbnail_url?: string;
  provider_name?: string;
};

export const resolveMusicLink = createServerFn({
  method: "GET",
})
  .inputValidator((data: { url: string }) => {
    if (!data || typeof data.url !== "string") {
      throw new Error("請貼上歌曲連結");
    }

    return {
      url: data.url.trim(),
    };
  })
  .handler(async ({ data }): Promise<MusicLinkMetadata> => {
    const provider = detectMusicLinkProvider(data.url);

    if (!provider) {
      throw new Error("目前支援 Spotify 與 Apple Music 連結");
    }

    if (provider === "apple-music") {
      return {
        provider,
        title: "",
        artist: "",
        album: "",
        url: data.url,
      };
    }

    const endpoint = new URL(
      "https://open.spotify.com/oembed",
    );

    endpoint.searchParams.set("url", data.url);

    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Spotify 歌曲資料讀取失敗");
    }

    const payload =
      (await response.json()) as SpotifyOEmbed;

    return {
      provider,
      title: payload.title?.trim() ?? "",
      artist: "",
      album: "",
      url: data.url,
      artworkUrl: payload.thumbnail_url?.trim() || undefined,
    };
  });
