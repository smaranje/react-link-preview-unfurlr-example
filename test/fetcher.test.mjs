// Offline tests run by default. The live test runs only when UNFURLR_PUBLISHABLE_KEY is set:
//   UNFURLR_PUBLISHABLE_KEY=pk_your_key UNFURLR_TEST_ORIGIN=https://your-site.example npm test
// Keys are read from the environment only. UNFURLR_TEST_ORIGIN must be one of the key's allowed origins;
// it is sent as the Origin header, as a browser would send it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { JSDOM } from "jsdom";
import { createUnfurlrFetcher } from "../src/unfurlrFetcher.js";

const dom = new JSDOM("<div id=r></div>", { url: "http://localhost/" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true });
const React = (await import("react")).default;
const { createRoot } = await import("react-dom/client");
const { act } = await import("react");
const { LinkPreview } = await import("@dhaiwat10/react-link-preview");

async function render(url, fetcher, waitMs = 300) {
  const el = document.createElement("div"); document.body.append(el);
  const root = createRoot(el);
  await act(async () => { root.render(React.createElement(LinkPreview, { url, fetcher })); });
  for (let t = 0; t < waitMs && !/\S/.test(el.querySelector(".Title, .Description")?.textContent || ""); t += 100)
    await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
  const text = el.textContent; act(() => root.unmount()); el.remove(); return text;
}

const META = { url: "https://github.com/", title: "GitHub", description: "Where software is built", site_name: "GitHub", images: ["https://github.githubassets.com/og.png"], icon_large: null };

test("maps /v1/metadata to the component's shape and sends the key in X-API-Key", async () => {
  let seen;
  const f = createUnfurlrFetcher({ apiKey: "pk_test", baseUrl: "https://api.example/", fetch: async (u, init) => { seen = { u, init }; return new Response(JSON.stringify(META)); } });
  assert.deepEqual(await f("https://github.com"), { title: "GitHub", description: "Where software is built", image: "https://github.githubassets.com/og.png", siteName: "GitHub", hostname: "github.com" });
  assert.equal(seen.u, "https://api.example/v1/metadata?url=https%3A%2F%2Fgithub.com");
  assert.equal(seen.init.headers["X-API-Key"], "pk_test");
  assert.ok(!seen.u.includes("key="), "the key goes in the header, not the URL");
});

test("falls back to icon_large, and returns null on API errors", async () => {
  const f = createUnfurlrFetcher({ fetch: async () => new Response(JSON.stringify({ ...META, images: [], icon_large: "https://x/icon.png" })) });
  assert.equal((await f("https://github.com")).image, "https://x/icon.png");
  const bad = createUnfurlrFetcher({ fetch: async () => new Response('{"error":{"code":"origin_not_allowed"}}', { status: 403 }) });
  assert.equal(await bad("https://github.com"), null);
});

test("renders a card with the component", async () => {
  const f = createUnfurlrFetcher({ apiKey: "pk_test", fetch: async () => new Response(JSON.stringify(META)) });
  assert.match(await render("https://github.com", f), /GitHub/);
});

test("no secret keys in the repo", () => {
  const files = [];
  const walk = (d) => { for (const n of readdirSync(d)) { if (["node_modules", ".git", "dist"].includes(n)) continue; const p = `${d}/${n}`; statSync(p).isDirectory() ? walk(p) : files.push(p); } };
  walk(new URL("..", import.meta.url).pathname.replace(/\/$/, ""));
  for (const p of files) {
    const t = readFileSync(p, "utf8");
    assert.doesNotMatch(t, /\b(mk|sk)_[A-Za-z0-9]{8,}/, `${p} looks like it contains a secret key`);
    assert.doesNotMatch(t, /\bpk_(?!your_key|test|invalid)[A-Za-z0-9]{8,}/, `${p} contains a real-looking pk_ key`);
  }
});

const PK = process.env.UNFURLR_PUBLISHABLE_KEY, ORIGIN = process.env.UNFURLR_TEST_ORIGIN;
const BASE = process.env.UNFURLR_BASE_URL || "https://unfurlr.onrender.com";
const withOrigin = (o) => (u, init = {}) => fetch(u, { ...init, headers: { ...init.headers, ...(o ? { Origin: o } : {}) }, signal: AbortSignal.timeout(90000) });

test("live: renders a real preview through unfurlr with a pk_ key", { skip: !PK && "set UNFURLR_PUBLISHABLE_KEY to run" }, async () => {
  const f = createUnfurlrFetcher({ apiKey: PK, baseUrl: BASE, fetch: withOrigin(ORIGIN) });
  const data = await f("https://github.com");
  assert.ok(data, "the API refused the key: is UNFURLR_TEST_ORIGIN on its allowlist?");
  assert.match(data.title, /GitHub/);
  assert.match(await render("https://github.com", async () => data), /GitHub/);
  assert.equal(await createUnfurlrFetcher({ apiKey: PK, baseUrl: BASE, fetch: withOrigin("https://evil.example") })("https://github.com"), null, "other origins must be refused");
});
