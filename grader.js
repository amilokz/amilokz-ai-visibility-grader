/* AI Visibility Grader — client-side grading engine (shared by index + compare) */
(function(){
"use strict";

var PROXIES = [
  // own serverless fetch first (same-origin, reliable) — falls back to public proxies
  function(u){ return "/api/fetch?url=" + encodeURIComponent(u); },
  function(u){ return "https://api.allorigins.win/raw?url=" + encodeURIComponent(u); },
  function(u){ return "https://corsproxy.io/?url=" + encodeURIComponent(u); }
];

function normalizeUrl(input){
  var u = (input||"").trim();
  if(!u) return null;
  if(!/^https?:\/\//i.test(u)) u = "https://" + u;
  try { return new URL(u).toString(); } catch(e){ return null; }
}
function domainOf(url){ try { return new URL(url).hostname.replace(/^www\./,""); } catch(e){ return url; } }

function fetchHtml(url){
  var MAX_RETRIES = 3;
  var attempt = function(i, retry){
    if(i >= PROXIES.length) return Promise.reject(new Error("fetch_failed"));
    return fetch(PROXIES[i](url), {cache:"no-store"}).then(function(r){
      if(!r.ok) throw new Error("bad_status");
      return r.text();
    }).then(function(t){
      if(!t || t.length < 200) throw new Error("empty");
      return t;
    }).catch(function(){
      // free proxies are flaky — retry same proxy before moving to next
      if(retry < MAX_RETRIES - 1) return attempt(i, retry + 1);
      return attempt(i + 1, 0);
    });
  };
  return attempt(0, 0);
}

/* ---- the 12 checks. Each returns {status:"pass"|"fail"|"warn", detail, fix} ---- */
function runChecks(html, url){
  var doc;
  try { doc = new DOMParser().parseFromString(html, "text/html"); }
  catch(e){ doc = document.implementation.createHTMLDocument(""); }

  var text = (doc.body ? doc.body.textContent : "") || "";
  var lower = html.toLowerCase();
  var checks = [];

  function add(name, status, detail, fix){
    checks.push({name:name, status:status, detail:detail, fix:fix});
  }

  // 1. Schema.org markup
  var hasSchema = /application\/ld\+json/i.test(html) &&
    /schema\.org/i.test(html) && /(LocalBusiness|Organization|Corporation|Store|Restaurant|MedicalBusiness|ProfessionalService)/i.test(html);
  add("Business info Google & AI can read (Schema markup)",
    hasSchema ? "pass" : "fail",
    hasSchema ? "Your site includes structured business data that AI assistants read directly."
              : "No business Schema markup found. AI assistants rely on this to understand who you are.",
    "Add LocalBusiness Schema markup to your homepage. Use our free Schema Generator — it writes the code for you.");

  // 2. FAQ content
  var hasFaq = /FAQPage/i.test(html) || /<h[1-6][^>]*>[^<]{0,120}frequently asked/i.test(html) || /\bfaqs?\b/i.test(html);
  add("Questions & answers on your site (FAQ content)",
    hasFaq ? "pass" : "fail",
    hasFaq ? "FAQ content found — AI assistants love quoting clear Q&A pages."
           : "No FAQ section found. AI assistants answer questions, so pages written as Q&A get quoted more.",
    "Add an FAQ section answering your 5 most common customer questions. Our free FAQ Generator writes them for you.");

  // 3. Title tag
  var titleEl = doc.querySelector("title");
  var title = titleEl ? titleEl.textContent.trim() : "";
  var tStat = "fail", tDetail = "No page title found — AI and Google both use the title to identify your business.";
  if(title.length >= 30 && title.length <= 60){ tStat="pass"; tDetail="Good title ("+title.length+" characters): \""+title.slice(0,70)+"\""; }
  else if(title.length > 0){ tStat="warn"; tDetail="Title exists but is "+title.length+" characters (aim for 30–60): \""+title.slice(0,70)+"\""; }
  add("Clear page title", tStat, tDetail,
    "Rewrite your homepage title as: Business Name — What You Do + City (30–60 characters).");

  // 4. Meta description
  var meta = doc.querySelector('meta[name="description"]');
  var mdesc = meta ? (meta.getAttribute("content")||"").trim() : "";
  var mStat = "fail", mDetail = "No meta description found — this is the summary AI assistants show about you.";
  if(mdesc.length >= 120 && mdesc.length <= 160){ mStat="pass"; mDetail="Good description ("+mdesc.length+" characters)."; }
  else if(mdesc.length > 0){ mStat="warn"; mDetail="Description exists but is "+mdesc.length+" characters (aim for 120–160)."; }
  add("Summary description (meta description)", mStat, mDetail,
    "Write 1–2 sentences: what you do, who you serve, and your city (120–160 characters).");

  // 5. H1
  var h1 = doc.querySelector("h1");
  var h1t = h1 ? h1.textContent.trim() : "";
  add("Main headline explains your business (H1)",
    h1t ? "pass" : "fail",
    h1t ? "Headline found: \""+h1t.slice(0,80)+"\"" : "No main headline (H1) found — AI can't tell what your business does at a glance.",
    "Add one clear H1 to your homepage, e.g. \"Family Dental Clinic in Austin\" — plain words, no slogans.");

  // 6. Phone number
  var phoneRe = /(\+\d[\d\s().-]{7,}\d|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b)/;
  var hasPhone = phoneRe.test(text);
  add("Phone number visible on the page",
    hasPhone ? "pass" : "fail",
    hasPhone ? "A phone number was found on your page."
             : "No phone number detected. AI assistants need contact details to recommend you.",
    "Put your phone number in the header or footer of every page, written out as text (not inside an image).");

  // 7. Physical address
  var addrRe = /(street|st\.|avenue|ave\.|road|rd\.|boulevard|blvd|suite|floor|building|\b\d{5}(-\d{4})?\b)/i;
  var hasAddr = addrRe.test(text) || /<address/i.test(html);
  add("Business address visible on the page",
    hasAddr ? "pass" : "fail",
    hasAddr ? "An address was detected on your page."
            : "No address detected. Local businesses without an address are rarely recommended by AI.",
    "Add your full street address to your contact page and footer, written out as text.");

  // 8. HTTPS
  var isHttps = /^https:/i.test(url);
  add("Secure website (HTTPS)",
    isHttps ? "pass" : "fail",
    isHttps ? "Your site loads over a secure connection."
            : "Your site is not using HTTPS. AI assistants distrust insecure sites.",
    "Ask your web host or developer to enable a free SSL certificate (most hosts offer one-click SSL).");

  // 9. Reviews / testimonials
  var revRe = /\b(reviews?|testimonials?|ratings?|\bstars?\b|4\.\d\s*\/\s*5|\d+\s*google\s*reviews?)/i;
  var hasRev = revRe.test(text);
  add("Customer reviews or testimonials shown",
    hasRev ? "pass" : "fail",
    hasRev ? "Review or testimonial content found — social proof AI assistants cite."
           : "No reviews or testimonials detected. AI assistants strongly prefer businesses with visible reviews.",
    "Ask happy customers for Google reviews, then display your rating and a few testimonials on your homepage.");

  // 10. About link
  var hasAbout = /href=["'][^"']*about/i.test(html);
  add("About page linked",
    hasAbout ? "pass" : "fail",
    hasAbout ? "An about page link was found."
             : "No about page link found. AI assistants look for a page explaining who you are.",
    "Add an About page telling your story: who you are, since when, and why customers trust you.");

  // 11. Contact link
  var hasContact = /href=["'][^"']*contact/i.test(html);
  add("Contact page linked",
    hasContact ? "pass" : "fail",
    hasContact ? "A contact page link was found."
               : "No contact page link found. Every business AI recommends needs an obvious way to reach you.",
    "Add a Contact page with phone, email, address, and a simple contact form.");

  // 12. Freshness signals
  var hasFresh = /<time/i.test(html) || /datePublished/i.test(html) || /href=["'][^"']*(blog|news)/i.test(html);
  add("Fresh content signals (blog, news, or dates)",
    hasFresh ? "pass" : "warn",
    hasFresh ? "Freshness signals found (blog, news, or published dates)."
             : "No blog, news section, or dates found. Sites that never update look abandoned to AI.",
    "Publish something new monthly — even one short update or tip post keeps your site looking alive.");

  return {checks:checks, title:title, metaDesc:mdesc, h1:h1t};
}

function scoreOf(checks){
  var pts = 0;
  checks.forEach(function(c){ pts += (c.status==="pass") ? 1 : (c.status==="warn" ? 0.5 : 0); });
  return Math.round(pts / checks.length * 100);
}
function gradeOf(score){
  if(score >= 90) return "A";
  if(score >= 75) return "B";
  if(score >= 60) return "C";
  if(score >= 40) return "D";
  return "F";
}
function gradeLabel(g){
  return {A:"Excellent — AI-ready", B:"Good — almost there", C:"Average — needs work",
          D:"Weak — likely invisible to AI", F:"Poor — AI can't see you"}[g] || "";
}
function gradeColor(g){
  return {A:"#36d399", B:"#a3e635", C:"#ffd24a", D:"#ff954a", F:"#ff6b6b"}[g] || "#d4af37";
}

/* AI preview simulation — built ONLY from their own site content */
function aiPreview(data, domain){
  var who = (data.title || data.h1 || domain).split("|")[0].split("—")[0].trim().slice(0,80);
  var what = (data.metaDesc || data.h1 || "a local business").trim();
  var whatLower = what.toLowerCase();
  var whoWords = who.toLowerCase().split(/\s+/).slice(0,3).join(" ");
  var preview;
  // description already introduces the business itself → use it directly (avoids "X is aY is an..." glitches)
  if (whatLower.indexOf(whoWords) === 0 || /^[A-Z][\w&]* is (an?|the) /i.test(what)) {
    preview = what;
  } else {
    preview = who + " — " + what.charAt(0).toLowerCase() + what.slice(1);
  }
  if (preview.length > 220) preview = preview.slice(0, 217).trim() + "...";
  return "Based on your site, an AI assistant might answer like this:\n\n\"" +
    preview + "\"\n\n" +
    "This is a simulation built from your title and description — not a live AI query. " +
    "Clearer titles and descriptions make this preview (and real AI answers) more accurate.";
}

/* localStorage progress */
function lastResult(domain){
  try { return JSON.parse(localStorage.getItem("avg_last") || "{}")[domain] || null; } catch(e){ return null; }
}
function saveResult(domain, score){
  try {
    var all = JSON.parse(localStorage.getItem("avg_last") || "{}");
    all[domain] = {score:score, date:new Date().toISOString().slice(0,10)};
    localStorage.setItem("avg_last", JSON.stringify(all));
  } catch(e){}
}

/* full grade pipeline: returns promise of {url, domain, score, grade, checks, previewHtml, delta} */
function grade(url){
  var normalized = normalizeUrl(url);
  if(!normalized) return Promise.reject(new Error("bad_url"));
  var domain = domainOf(normalized);
  return fetchHtml(normalized).then(function(html){
    return gradeHtml(html, normalized);
  });
}

/* grade pasted HTML directly (fallback when auto-fetch is blocked) */
function gradeHtml(html, url){
  var normalized = normalizeUrl(url) || "https://pasted-site.local/";
  var domain = domainOf(normalized);
  if(!html || html.length < 200) return Promise.reject(new Error("empty_html"));
  var data = runChecks(html, normalized);
  var score = scoreOf(data.checks);
  var grade = gradeOf(score);
  var prev = lastResult(domain);
  var delta = null;
  if(prev && typeof prev.score === "number" && prev.score !== score){
    delta = {diff: score - prev.score, prevDate: prev.date};
  }
  saveResult(domain, score);
  return Promise.resolve({url:normalized, domain:domain, score:score, grade:grade,
          checks:data.checks, preview:aiPreview(data, domain), delta:delta});
}

/* rendering helpers */
function iconFor(status){
  if(status==="pass") return '<svg class="ic pass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>';
  if(status==="warn") return '<svg class="ic warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>';
  return '<svg class="ic fail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>';
}
function badgeFor(status){
  return status==="pass" ? "Pass" : (status==="warn" ? "Needs work" : "Missing");
}

window.AVG = {
  grade:grade, gradeHtml:gradeHtml, gradeLabel:gradeLabel, gradeColor:gradeColor,
  iconFor:iconFor, badgeFor:badgeFor, domainOf:domainOf, normalizeUrl:normalizeUrl
};
})();
