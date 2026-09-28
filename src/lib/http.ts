/**
 * True when Origin is absent, or matches the request URL or the Host the
 * client used. The bind address (for example 0.0.0.0) is not that host.
 */
export function validOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let claimed: string;
  try {
    claimed = new URL(origin).origin;
  } catch {
    return false;
  }
  const allowed = new Set<string>([new URL(request.url).origin]);
  const fromHost = originForHost(request);
  if (fromHost) allowed.add(fromHost);
  return allowed.has(claimed);
}
function originForHost(request: Request) {
  const host = request.headers.get("host")?.trim().toLowerCase();
  if (!host || /[\s@/\\]/.test(host)) return null;
  const forwarded = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const proto =
    forwarded === "http" || forwarded === "https"
      ? forwarded
      : new URL(request.url).protocol.replace(":", "");
  if (proto !== "http" && proto !== "https") return null;
  try {
    const url = new URL(`${proto}://${host}`);
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}
export async function boundedJson(
  request: Request,
  limit = 64000,
): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > limit)
    throw new Error("Request too large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(value);
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(result));
}
