import path from "path";

/**
 * Read the first n characters of a response body as text
 */
export async function textResponseHead({
  response,
  n = 10240,
}: {
  response: Response;
  n?: number;
}) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  let text = "";
  const utf8Decoder = new TextDecoder("utf-8");
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += utf8Decoder.decode(value, { stream: true });
    if (text.length > n) {
      await reader.cancel();
      break;
    }
  }
  return text;
}

export function urlToFilename(_url: string) {
  const url = new URL(_url);
  if (isUserUploadedUrl(_url)) {
    return decodeURIComponent(path.basename(url.pathname));
  } else {
    return `${url.hostname}${url.pathname}${url.search}`;
  }
}

export function isUserUploadedUrl(url: string) {
  return (
    url.includes(`storage.googleapis.com`) && url.includes(`daras_ai/media`)
  );
}
