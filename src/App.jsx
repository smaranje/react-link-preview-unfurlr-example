import { LinkPreview } from "@dhaiwat10/react-link-preview";
import { createUnfurlrFetcher } from "./unfurlrFetcher.js";

// VITE_UNFURLR_PK is a publishable pk_ key locked to this site's origins (see README). Never your secret key.
const fetcher = createUnfurlrFetcher({ apiKey: import.meta.env.VITE_UNFURLR_PK });

export default function App() {
  return (
    <main style={{ maxWidth: 480, margin: "40px auto", display: "grid", gap: 16, fontFamily: "system-ui" }}>
      <h1>react-link-preview + unfurlr</h1>
      <LinkPreview url="https://github.com" fetcher={fetcher} width="100%" />
      <LinkPreview url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" fetcher={fetcher} width="100%" />
    </main>
  );
}
