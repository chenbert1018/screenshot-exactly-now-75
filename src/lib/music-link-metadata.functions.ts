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

type SpotifyEmbedArtist = {
  name?: string;
};

type SpotifyEmbedImage = {
  url?: string;
  maxHeight?: number;
  maxWidth?: number;
};

type SpotifyEmbedEntity = {
  name?: string;
  title?: string;
  artists?: SpotifyEmbedArtist[];
  visualIdentity?: {
    image?: SpotifyEmbedImage[];
  };
};

type SpotifyNextData = {
  props?: {
    pageProps?: {
      state?: {
        data?: {
          entity?: SpotifyEmbedEntity;
        };
      };
    };
  };
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function metaContent(
  html: string,
  property: string,
) {
  const escaped = property.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const propertyFirst = html.match(
    new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      "i",
    ),
  );

  if (propertyFirst?.[1]) {
    return decodeHtml(propertyFirst[1].trim());
  }

  const contentFirst = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${escaped}["'][^>]*>`,
      "i",
    ),
  );

  return contentFirst?.[1]
    ? decodeHtml(contentFirst[1].trim())
    : "";
}

function parseAppleSongTitle(
  ogTitle: string,
  artist: string,
) {
  const match = ogTitle.match(
    /《(.+?)》/,
  );

  if (match?.[1]) {
    return match[1].trim();
  }

  let value = ogTitle
    .replace(/\s*[-–—]\s*Apple Music.*$/i, "")
    .replace(/\s+on Apple Music.*$/i, "")
    .trim();

  if (
    artist &&
    value.toLowerCase().startsWith(
      artist.toLowerCase(),
    )
  ) {
    value = value
      .slice(artist.length)
      .replace(/^[\s:：\-–—]+/, "")
      .trim();
  }

  return value;
}

function artistFromAppleMusicianUrl(
  musicianUrl: string,
) {
  if (!musicianUrl) return "";

  try {
    const url = new URL(musicianUrl);
    const parts = url.pathname
      .split("/")
      .filter(Boolean);

    const artistIndex =
      parts.indexOf("artist");

    if (artistIndex < 0) return "";

    const slug = parts[artistIndex + 1] ?? "";

    return decodeURIComponent(slug)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      );
  } catch {
    return "";
  }
}

function parseAppleArtist(
  ogTitle: string,
  musicianUrl: string,
) {
  const localizedMatch = ogTitle.match(
    /^(.+?)在\s*Apple Music\s*上的/,
  );

  if (localizedMatch?.[1]) {
    return localizedMatch[1].trim();
  }

  const englishMatch = ogTitle.match(
    /^(.+?)['’]s\s+[“"'].*?[”"']/,
  );

  if (englishMatch?.[1]) {
    return englishMatch[1].trim();
  }

  return artistFromAppleMusicianUrl(
    musicianUrl,
  );
}

function parseAppleAlbumTitle(
  ogTitle: string,
  artist: string,
) {
  const match = ogTitle.match(
    /《(.+?)》/,
  );

  if (match?.[1]) {
    return match[1].trim();
  }

  let value = ogTitle
    .replace(/\s*[-–—]\s*Apple Music.*$/i, "")
    .replace(/\s+on Apple Music.*$/i, "")
    .trim();

  if (
    artist &&
    value.toLowerCase().startsWith(
      artist.toLowerCase(),
    )
  ) {
    value = value
      .slice(artist.length)
      .replace(/^[\s:：\-–—]+/, "")
      .trim();
  }

  return value;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (compatible; IdolDays/1.0)",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `歌曲資料讀取失敗 (${response.status})`,
    );
  }

  return response.text();
}

function spotifyTrackId(value: string) {
  try {
    const url = new URL(value);
    const parts = url.pathname
      .split("/")
      .filter(Boolean);

    const trackIndex = parts.indexOf("track");

    if (trackIndex < 0) return "";

    return parts[trackIndex + 1] ?? "";
  } catch {
    return "";
  }
}

function extractNextData(html: string) {
  const match = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );

  if (!match?.[1]) {
    return null;
  }

  try {
    return JSON.parse(
      match[1],
    ) as SpotifyNextData;
  } catch {
    return null;
  }
}

async function resolveSpotifyMusic(
  url: string,
): Promise<MusicLinkMetadata> {
  const endpoint = new URL(
    "https://open.spotify.com/oembed",
  );

  endpoint.searchParams.set("url", url);

  const oEmbedResponse = await fetch(
    endpoint,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!oEmbedResponse.ok) {
    throw new Error(
      "Spotify 歌曲資料讀取失敗",
    );
  }

  const oEmbed =
    (await oEmbedResponse.json()) as SpotifyOEmbed;

  let title = oEmbed.title?.trim() ?? "";
  let artist = "";
  let artworkUrl =
    oEmbed.thumbnail_url?.trim() || undefined;

  const trackId = spotifyTrackId(url);

  if (trackId) {
    try {
      const embedUrl =
        `https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}`;

      const embedHtml =
        await fetchHtml(embedUrl);

      const nextData =
        extractNextData(embedHtml);

      const entity =
        nextData?.props?.pageProps?.state?.data?.entity;

      const entityTitle =
        entity?.name?.trim() ||
        entity?.title?.trim();

      if (entityTitle) {
        title = entityTitle;
      }

      const artists = (
        entity?.artists ?? []
      )
        .map((item) => item.name?.trim())
        .filter(
          (name): name is string =>
            Boolean(name),
        );

      if (artists.length > 0) {
        artist = artists.join(", ");
      }

      const images =
        entity?.visualIdentity?.image ?? [];

      const bestImage = [...images]
        .filter((image) => Boolean(image.url))
        .sort(
          (a, b) =>
            (b.maxWidth ?? 0) -
            (a.maxWidth ?? 0),
        )[0];

      if (bestImage?.url) {
        artworkUrl = bestImage.url;
      }
    } catch (error) {
      console.warn(
        "[IdolDays Spotify embed metadata]",
        error,
      );
    }
  }

  if (!title) {
    throw new Error(
      "Spotify 歌名讀取失敗",
    );
  }

  return {
    provider: "spotify",
    title,
    artist,
    album: "",
    url,
    artworkUrl,
  };
}

async function resolveAppleMusic(
  url: string,
): Promise<MusicLinkMetadata> {
  const html = await fetchHtml(url);

  const ogTitle = metaContent(
    html,
    "og:title",
  );

  const artworkUrl = metaContent(
    html,
    "og:image",
  );

  const musicianUrl = metaContent(
    html,
    "music:musician",
  );

  const albumUrl = metaContent(
    html,
    "music:album",
  );

  const artist = parseAppleArtist(
    ogTitle,
    musicianUrl,
  );

  const title = parseAppleSongTitle(
    ogTitle,
    artist,
  );

  let album = "";

  if (albumUrl) {
    try {
      const albumHtml =
        await fetchHtml(albumUrl);

      const albumOgTitle = metaContent(
        albumHtml,
        "og:title",
      );

      album = parseAppleAlbumTitle(
        albumOgTitle,
        artist,
      );
    } catch (error) {
      console.warn(
        "[IdolDays Apple Music album metadata]",
        error,
      );
    }
  }

  if (!title) {
    throw new Error(
      "Apple Music 歌名讀取失敗",
    );
  }

  return {
    provider: "apple-music",
    title,
    artist,
    album,
    url,
    artworkUrl: artworkUrl || undefined,
  };
}

export const resolveMusicLink = createServerFn({
  method: "GET",
})
  .inputValidator((data: { url: string }) => {
    if (
      !data ||
      typeof data.url !== "string"
    ) {
      throw new Error("請貼上歌曲連結");
    }

    return {
      url: data.url.trim(),
    };
  })
  .handler(
    async ({
      data,
    }): Promise<MusicLinkMetadata> => {
      const provider =
        detectMusicLinkProvider(data.url);

      if (!provider) {
        throw new Error(
          "目前支援 Spotify 與 Apple Music 連結",
        );
      }

      if (provider === "apple-music") {
        return resolveAppleMusic(
          data.url,
        );
      }

      return resolveSpotifyMusic(
        data.url,
      );
    },
  );
