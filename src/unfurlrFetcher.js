// A `fetcher` for @dhaiwat10/react-link-preview that calls unfurlr.
// Browser code must use a publishable pk_ key (origin-locked, its own 100/month quota), sent in X-API-Key.
// Never put your secret key in browser code.
export function createUnfurlrFetcher({ apiKey, baseUrl = "https://unfurlr.onrender.com", fetch: f = (...a) => fetch(...a) } = {}) {
  const base = baseUrl.replace(/\/+$/, "");
  return async function unfurlrFetcher(url) {
    const r = await f(`${base}/v1/metadata?url=${encodeURIComponent(url)}`, {
      headers: apiKey ? { "X-API-Key": apiKey } : {},
    });
    if (!r.ok) return null; // the component shows its fallback
    const d = await r.json();
    return {
      title: d.title,
      description: d.description,
      image: d.images?.[0] ?? d.icon_large ?? null,
      siteName: d.site_name,
      hostname: new URL(d.url).hostname,
    };
  };
}
