# react-link-preview + unfurlr

Use [unfurlr](https://unfurlr.onrender.com/?ref=gh-react) as the `fetcher` for [`@dhaiwat10/react-link-preview`](https://github.com/Dhaiwat10/react-link-preview). By default the component fetches through a shared demo proxy. With this fetcher it calls unfurlr instead, which returns title, description, image and site name as JSON, with no CORS errors.

**Live demo and free key:** https://unfurlr.onrender.com/?ref=gh-react

## The fetcher

```jsx
import { LinkPreview } from "@dhaiwat10/react-link-preview";
import { createUnfurlrFetcher } from "./unfurlrFetcher.js";

const fetcher = createUnfurlrFetcher({ apiKey: import.meta.env.VITE_UNFURLR_PK }); // publishable pk_ key

<LinkPreview url="https://github.com" fetcher={fetcher} />;
```

[`src/unfurlrFetcher.js`](src/unfurlrFetcher.js) is about 15 lines. It calls `GET /v1/metadata` with the key in the `X-API-Key` header, maps the response to the component's `{ title, description, image, siteName, hostname }` shape, and returns `null` on errors so the component shows its fallback.

## Get a browser key (`pk_`)

This code runs in the browser, so use a **publishable `pk_` key**, never your secret key.

1. Get a free account key (500 requests/month, no card) at https://unfurlr.onrender.com/?ref=gh-react
2. On your machine (not in the page), lock it to your site's origins and create the browser key:

```bash
U=https://unfurlr.onrender.com; K="$UNFURLR_API_KEY"   # your secret key
curl -X PUT  "$U/v1/keys/origins"     -H "X-API-Key: $K" -H "Content-Type: application/json" -d '{"origins":["http://localhost:5173","https://your-site.example"]}'
curl -X POST "$U/v1/keys/publishable" -H "X-API-Key: $K"   # -> {"publishable_key":"pk_...", ...}
```

A `pk_` key works only from the listed origins and only for single previews. It has its own 100 requests/month quota, so a leaked key can't touch your account's 500 or read your usage. Revoke it with `DELETE /v1/keys/publishable`.

## Run it

```bash
npm install
cp .env.example .env.local    # then set VITE_UNFURLR_PK=pk_your_key
npm run dev                   # http://localhost:5173
```

The free server sleeps when idle and can take about a minute to wake on the first request. Some sites (X profiles, Reddit, Facebook, some big news sites) block all bots; the component shows its fallback for those.

## Tests

```bash
npm test   # offline: mapping, header, rendering, and a scan for committed keys; the live test is skipped
UNFURLR_PUBLISHABLE_KEY=pk_your_key UNFURLR_TEST_ORIGIN=https://your-site.example npm test   # also hits the live API
```

`UNFURLR_TEST_ORIGIN` must be one of the key's allowed origins. The test sends it as the `Origin` header, the way a browser would. Keys are read from the environment only.

Support: smaran+unfurlr@mail.grokbot.com · License: MIT
