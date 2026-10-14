/* Vercel serverless: fetch any public URL server-side (no CORS, no flaky third-party proxy) */
export default async function handler(req, res) {
  const target = (req.query.url || "").trim();
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).json({ error: "bad_url" });
  }
  // SSRF guard: only http/https, no localhost/private IPs via hostname check
  let parsed;
  try { parsed = new URL(target); } catch { return res.status(400).json({ error: "bad_url" }); }
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.startsWith("127.") || host === "::1" ||
      host.startsWith("10.") || host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host.endsWith(".internal")) {
    return res.status(400).json({ error: "blocked_host" });
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const r = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return res.status(502).json({ error: "fetch_failed", status: r.status });
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    if (ct && !ct.includes("html") && !ct.includes("text")) {
      return res.status(502).json({ error: "not_html" });
    }
    let html = await r.text();
    if (!html || html.length < 200) return res.status(502).json({ error: "empty" });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(html.slice(0, 500000));
  } catch (e) {
    return res.status(502).json({ error: "fetch_failed" });
  }
}
