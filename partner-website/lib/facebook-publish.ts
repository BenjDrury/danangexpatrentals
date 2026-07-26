import { FACEBOOK_GRAPH_VERSION } from "@/lib/facebook-oauth";

const MAX_PHOTOS = 10;

export type FacebookPublishResult = {
  postId: string;
  permalink?: string | null;
};

type GraphError = { error?: { message?: string; code?: number } };

function graphUrl(path: string): string {
  return `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}${path}`;
}

async function readGraphJson<T>(res: Response): Promise<T & GraphError> {
  return (await res.json()) as T & GraphError;
}

/** Upload one photo unpublished so it can be attached to a multi-photo feed post. */
async function uploadUnpublishedPhoto(params: {
  pageId: string;
  accessToken: string;
  imageUrl: string;
}): Promise<string> {
  const body = new URLSearchParams({
    url: params.imageUrl,
    published: "false",
    access_token: params.accessToken,
  });
  const res = await fetch(graphUrl(`/${params.pageId}/photos`), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await readGraphJson<{ id?: string }>(res);
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message ?? "Could not upload photo to Facebook.");
  }
  return data.id;
}

/**
 * Publish a Page post with optional photos (public image URLs).
 * Multi-photo: upload unpublished photos, then attach on /feed.
 * No photos: text-only /feed post.
 */
export async function publishPagePost(params: {
  pageId: string;
  accessToken: string;
  message: string;
  imageUrls: string[];
}): Promise<FacebookPublishResult> {
  const message = params.message.trim();
  if (!message) {
    throw new Error("Caption is required.");
  }

  const urls = [...new Set(params.imageUrls.map((u) => u.trim()).filter(Boolean))].slice(
    0,
    MAX_PHOTOS,
  );

  if (urls.length === 0) {
    const body = new URLSearchParams({
      message,
      access_token: params.accessToken,
    });
    const res = await fetch(graphUrl(`/${params.pageId}/feed`), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await readGraphJson<{ id?: string }>(res);
    if (!res.ok || !data.id) {
      throw new Error(data.error?.message ?? "Could not publish Facebook post.");
    }
    return { postId: data.id, permalink: `https://www.facebook.com/${data.id}` };
  }

  if (urls.length === 1) {
    const body = new URLSearchParams({
      url: urls[0],
      caption: message,
      published: "true",
      access_token: params.accessToken,
    });
    const res = await fetch(graphUrl(`/${params.pageId}/photos`), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await readGraphJson<{ id?: string; post_id?: string }>(res);
    if (!res.ok || !(data.post_id || data.id)) {
      throw new Error(data.error?.message ?? "Could not publish Facebook photo.");
    }
    const postId = data.post_id ?? data.id!;
    return { postId, permalink: `https://www.facebook.com/${postId}` };
  }

  const photoIds: string[] = [];
  for (const imageUrl of urls) {
    photoIds.push(
      await uploadUnpublishedPhoto({
        pageId: params.pageId,
        accessToken: params.accessToken,
        imageUrl,
      }),
    );
  }

  const body = new URLSearchParams({
    message,
    access_token: params.accessToken,
  });
  photoIds.forEach((id, i) => {
    body.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: id }));
  });

  const res = await fetch(graphUrl(`/${params.pageId}/feed`), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await readGraphJson<{ id?: string }>(res);
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message ?? "Could not publish multi-photo Facebook post.");
  }
  return { postId: data.id, permalink: `https://www.facebook.com/${data.id}` };
}

export { MAX_PHOTOS as FACEBOOK_POST_MAX_PHOTOS };
