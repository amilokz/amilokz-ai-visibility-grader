/* Visibility Booster — backlink opportunities + keyword ideas. Client-side only. */
(function(){
"use strict";

var PROXIES = [
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
function fetchHtml(url){
  var attempt = function(i){
    if(i >= PROXIES.length) return Promise.reject(new Error("fetch_failed"));
    return fetch(PROXIES[i](url), {cache:"no-store"}).then(function(r){
      if(!r.ok) throw new Error("bad_status");
      return r.text();
    }).then(function(t){
      if(!t || t.length < 200) throw new Error("empty");
      return t;
    }).catch(function(){ return attempt(i+1); });
  };
  return attempt(0);
}
function esc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ---------- site parsing ---------- */
function parseSite(html, url){
  var doc;
  try { doc = new DOMParser().parseFromString(html, "text/html"); }
  catch(e){ doc = document.implementation.createHTMLDocument(""); }
  var q = function(s){ var el = doc.querySelector(s); return el ? el.textContent.trim() : ""; };
  var links = [];
  try {
    doc.querySelectorAll("a[href]").forEach(function(a){
      var h = a.getAttribute("href") || "";
      if(h) links.push(h.toLowerCase());
    });
  } catch(e){}
  var meta = doc.querySelector('meta[name="description"]');
  return {
    url: url,
    title: q("title"),
    h1: q("h1"),
    metaDesc: meta ? (meta.getAttribute("content")||"").trim() : "",
    links: links,
    linksStr: links.join(" "),
    htmlLower: html.toLowerCase(),
    text: (doc.body ? doc.body.textContent : "") || ""
  };
}

/* ---------- niche detection ---------- */
var NICHES = [
  {id:"restaurant", label:"restaurant / food", words:["restaurant","pizza","cafe","coffee","bakery","food","diner","eatery","burger","shawarma"]},
  {id:"medical", label:"clinic / medical", words:["dentist","dental","clinic","hospital","doctor","medical","physio","derma","pediatric"]},
  {id:"beauty", label:"salon / beauty", words:["salon","beauty","spa","barber","makeup","nails"]},
  {id:"legal", label:"law firm", words:["law","attorney","lawyer","legal","advocate"]},
  {id:"realestate", label:"real estate", words:["real estate","property","realtor","plots","apartment","housing"]},
  {id:"home", label:"home services", words:["plumber","electrician","hvac","repair","cleaning","pest","carpenter","painter"]},
  {id:"agency", label:"agency / digital", words:["agency","marketing","software","web design","developer","seo","digital","studio"]},
  {id:"travel", label:"travel / hotel", words:["hotel","travel","tour","guest house","resort"]}
];
function detectNiche(site){
  var hay = (site.title + " " + site.h1 + " " + site.metaDesc).toLowerCase();
  var best = null, bestN = 0;
  NICHES.forEach(function(n){
    var c = 0;
    n.words.forEach(function(w){ if(hay.indexOf(w) !== -1) c++; });
    if(c > bestN){ bestN = c; best = n; }
  });
  return bestN > 0 ? best : {id:"other", label:"local business"};
}

var NICHE_DIRS = {
  restaurant: [
    {name:"TripAdvisor", desc:"The world's largest restaurant review platform.", url:"https://www.tripadvisor.com/"},
    {name:"Zomato", desc:"Food discovery — huge across Asia and the Middle East.", url:"https://www.zomato.com/"}
  ],
  medical: [
    {name:"Practo", desc:"Doctor and clinic discovery, strong across Asia.", url:"https://www.practo.com/"},
    {name:"Zocdoc", desc:"Medical booking directory (US).", url:"https://www.zocdoc.com/"}
  ],
  beauty: [
    {name:"Fresha", desc:"Salon and spa booking directory.", url:"https://www.fresha.com/"}
  ],
  legal: [
    {name:"Avvo", desc:"Lawyer directory with Q&A visibility.", url:"https://www.avvo.com/"}
  ],
  realestate: [
    {name:"Zillow", desc:"Property listings plus agent profiles.", url:"https://www.zillow.com/"}
  ],
  home: [
    {name:"Angi", desc:"Home-services directory customers trust.", url:"https://www.angi.com/"},
    {name:"Thumbtack", desc:"Local pros marketplace.", url:"https://www.thumbtack.com/"}
  ],
  agency: [
    {name:"Clutch", desc:"B2B agency reviews — a high-authority backlink.", url:"https://clutch.co/"},
    {name:"DesignRush", desc:"Agency directory with strong SEO.", url:"https://www.designrush.com/"}
  ],
  travel: [
    {name:"TripAdvisor", desc:"Hotels and tours — reviews travellers actually read.", url:"https://www.tripadvisor.com/"}
  ],
  other: [
    {name:"Yellow Pages", desc:"The classic directory — still crawled heavily.", url:"https://www.yellowpages.com/"}
  ]
};

/* ---------- backlink opportunities ---------- */
function buildOpps(site, niche){
  var L = site.linksStr, H = site.htmlLower;
  var has = function(s){ return L.indexOf(s) !== -1; };
  return [
    {cat:"Local citations", items:[
      {name:"Google Business Profile", desc:"The #1 free listing — puts you on Google Maps.", url:"https://www.google.com/business/", done:(H.indexOf("google.com/maps")!==-1 || has("g.page"))},
      {name:"Bing Places", desc:"Microsoft's version — puts you on Bing Maps.", url:"https://www.bingplaces.com/", done:false},
      {name:"Apple Business Connect", desc:"Puts your business on Apple Maps.", url:"https://businessconnect.apple.com/", done:false}
    ]},
    {cat:"Review platforms", items:[
      {name:"Trustpilot", desc:"Public reviews that customers — and AI — trust.", url:"https://www.trustpilot.com/", done:has("trustpilot.com")},
      {name:"Yelp", desc:"Major review directory with a strong Google presence.", url:"https://www.yelp.com/", done:has("yelp.com")}
    ]},
    {cat:"Social profiles", items:[
      {name:"Facebook", desc:"Business page = backlink + reviews.", url:"https://www.facebook.com/", done:has("facebook.com")},
      {name:"Instagram", desc:"Visual proof for local businesses.", url:"https://www.instagram.com/", done:has("instagram.com")},
      {name:"LinkedIn", desc:"Company page — a high-authority link.", url:"https://www.linkedin.com/", done:has("linkedin.com")},
      {name:"X (Twitter)", desc:"Fast indexing, real-time presence.", url:"https://x.com/", done:(has("twitter.com")||has("x.com"))},
      {name:"YouTube", desc:"Video content Google loves to rank.", url:"https://www.youtube.com/", done:has("youtube.com")},
      {name:"TikTok", desc:"Discovery engine for local businesses.", url:"https://www.tiktok.com/", done:has("tiktok.com")}
    ]},
    {cat:"Industry directories (" + esc(niche.label) + ")", items:(NICHE_DIRS[niche.id]||NICHE_DIRS.other).map(function(d){
      d.done = has(d.url.replace(/^https?:\/\//,"").split("/")[0]);
      return d;
    })}
  ];
}

function renderOpps(site){
  var niche = detectNiche(site);
  var groups = buildOpps(site, niche);
  var total = 0, done = 0, html = "";
  groups.forEach(function(g){
    html += '<div class="opp-group"><h3>' + g.cat + '</h3>';
    g.items.forEach(function(it){
      total++; if(it.done) done++;
      html += '<div class="opp-item' + (it.done ? " is-done" : "") + '">' +
        '<div class="opp-info"><b>' + esc(it.name) + '</b><span>' + esc(it.desc) + '</span></div>' +
        '<span class="opp-badge">' + (it.done ? "Claimed ✓" : "Missing") + '</span>' +
        '<a class="btn btn-ghost btn-sm" href="' + esc(it.url) + '" target="_blank" rel="noopener">Claim →</a>' +
        '</div>';
    });
    html += '</div>';
  });
  document.getElementById("oppGroups").innerHTML = html;
  var pct = total ? Math.round(done/total*100) : 0;
  var ring = document.getElementById("oppRing");
  ring.style.setProperty("--p", pct);
  ring.style.setProperty("--rc", "#d4af37");
  document.getElementById("oppNum").textContent = done + "/" + total;
  var sub = document.getElementById("oppSub");
  if(pct < 40) sub.textContent = "Lots of untapped ground — each listing is a real backlink plus a citation Google trusts. Start at the top.";
  else if(pct < 75) sub.textContent = "Solid start — claim the remaining ones to complete your citation footprint.";
  else sub.textContent = "Excellent — your citation footprint is strong. Keep every listing's name, address and phone identical.";
  document.getElementById("linksEmpty").hidden = true;
  document.getElementById("linksResult").hidden = false;
}

/* ---------- keyword ideas ---------- */
function guessService(site){
  var s = (site.h1 && site.h1.length < 60) ? site.h1 : (site.title || "");
  s = s.split(/[|–—]/)[0];                       // drop " | Brand"
  s = s.split(" - ")[0];                         // drop " - Brand"
  s = s.replace(/,\s*[A-Z][a-zA-Z]+(?:\s+[A-Z][a-z]+)?\s*$/,""); // drop trailing ", City"
  s = s.replace(/\s+(in|at|near)\s+[A-Z][a-zA-Z]+(\s+[A-Z][a-z]+)?\s*$/,""); // drop " in City"
  s = s.replace(/^(best|top)\s+/i,"");           // drop leading "best "
  return s.trim().slice(0, 60);
}
function guessCity(site){
  var strs = [site.title, site.h1];
  for(var i=0;i<strs.length;i++){
    var m = /\b(?:in|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-z]+)?)/.exec(strs[i]||"");
    if(m) return m[1];
  }
  var c = /,\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-z]+)?)\s*(?:[|–—\-]|$)/.exec(site.title||"");
  return c ? c[1] : "";
}
function topTopics(text){
  var stop = {the:1,and:1,for:1,you:1,your:1,with:1,our:1,are:1,that:1,this:1,from:1,have:1,has:1,will:1,can:1,all:1,more:1,about:1,contact:1,home:1,page:1,they:1,their:1,there:1,been:1,which:1,when:1,what:1,how:1,why:1,who:1,not:1,but:1,also:1,into:1,over:1,than:1,then:1,them:1,only:1,just:1,like:1,click:1,here:1,learn:1,read:1,view:1,call:1,today:1,free:1,best:1,new:1,now:1,get:1,one:1,two:1,services:1,service:1,business:1,company:1,welcome:1};
  var freq = {};
  text.toLowerCase().replace(/[^a-z\s]/g," ").split(/\s+/).forEach(function(w){
    if(w.length > 4 && !stop[w]) freq[w] = (freq[w]||0) + 1;
  });
  return Object.keys(freq).sort(function(a,b){ return freq[b]-freq[a]; }).slice(0,6);
}

function buildKeywords(service, city, topics){
  var S = service.toLowerCase().replace(/\s+/g," ").trim();
  var C = (city||"").trim();
  var groups = [];
  if(!S) return groups;
  var local = [], commercial = [], info = [], ai = [];
  if(C){
    local.push(S+" in "+C, "best "+S+" in "+C, "top "+S+" in "+C, S+" near me",
               "affordable "+S+" "+C, S+" "+C+" reviews");
  } else {
    local.push(S+" near me", "best "+S, "affordable "+S, S+" reviews");
  }
  commercial.push(S+" cost", S+" price", "book "+S+" online", S+" deals", "affordable "+S);
  if(C) commercial.push(S+" price in "+C);
  info.push("how to choose "+S, "what is "+S, S+" tips", S+" benefits", "how much does "+S+" cost");
  ai.push("what is the best "+S+(C ? " in "+C : "")+"?", "how much does "+S+" cost?",
          "is "+S+" worth it?", "where can I find "+S+" near me?");
  groups.push({name:"Local — people ready to visit/buy", items:local});
  groups.push({name:"Commercial — comparing prices", items:commercial});
  groups.push({name:"Informational — learning first", items:info});
  groups.push({name:"AI-search questions — what people ask ChatGPT", items:ai});
  if(topics && topics.length){
    var t = [];
    topics.slice(0,3).forEach(function(w){
      t.push(w+" guide", w+" tips", "best "+w);
    });
    groups.push({name:"From your own content — topics you already cover", items:t});
  }
  return groups;
}

function renderKeywords(service, city, topics){
  var groups = buildKeywords(service, city, topics);
  var host = document.getElementById("kwGroups");
  if(!groups.length){
    host.innerHTML = '<p class="hint">Type what you do above and click "Generate ideas".</p>';
    return;
  }
  var n = 0, html = "";
  groups.forEach(function(g, gi){
    n += g.items.length;
    html += '<div class="kw-group"><div class="kw-head"><h3>' + esc(g.name) + '</h3>' +
      '<button class="btn btn-ghost btn-sm kw-copy" data-g="' + gi + '" type="button">Copy all</button></div>' +
      '<div class="kw-list">';
    g.items.forEach(function(k){ html += '<span class="kw-chip">' + esc(k) + '</span>'; });
    html += '</div></div>';
  });
  host.innerHTML = html;
  host.dataset.groups = JSON.stringify(groups.map(function(g){ return g.items; }));
  document.getElementById("keysEmpty").hidden = true;
  document.getElementById("keysResult").hidden = false;
  var msg = document.getElementById("b_msg");
  msg.textContent = n + " keyword ideas generated — honest count, no invented search volumes.";
  host.querySelectorAll(".kw-copy").forEach(function(btn){
    btn.addEventListener("click", function(){
      var items = JSON.parse(host.dataset.groups)[+btn.dataset.g];
      navigator.clipboard.writeText(items.join("\n")).then(function(){
        btn.textContent = "Copied!";
        setTimeout(function(){ btn.textContent = "Copy all"; }, 1800);
      });
    });
  });
}

/* ---------- tabs ---------- */
var tabLinks = document.getElementById("tabLinks");
var tabKeys = document.getElementById("tabKeys");
var panelLinks = document.getElementById("panelLinks");
var panelKeys = document.getElementById("panelKeys");
var tabDesc = document.getElementById("tabDesc");
function setTab(links){
  tabLinks.classList.toggle("active", links);
  tabKeys.classList.toggle("active", !links);
  tabLinks.setAttribute("aria-selected", String(links));
  tabKeys.setAttribute("aria-selected", String(!links));
  panelLinks.hidden = !links;
  panelKeys.hidden = links;
  tabDesc.textContent = links
    ? "Real directories, citations and review sites where your business can earn backlinks — detected against your site."
    : "Long-tail keyword ideas built from your content — grouped by intent, ready to copy.";
}
tabLinks.addEventListener("click", function(){ setTab(true); });
tabKeys.addEventListener("click", function(){ setTab(false); });

/* ---------- analyze flow ---------- */
var siteData = null;
function setMsg(t){ document.getElementById("b_msg").textContent = t; }

function runAnalysis(url, htmlOverride){
  var go = document.getElementById("b_go");
  go.disabled = true; go.textContent = "Analyzing…";
  setMsg("Fetching your site and reading its content…");
  var p = htmlOverride
    ? (htmlOverride.length > 200 ? Promise.resolve(htmlOverride) : Promise.reject(new Error("empty_html")))
    : fetchHtml(url);
  p.then(function(html){
    siteData = parseSite(html, url);
    renderOpps(siteData);
    document.getElementById("k_service").value = guessService(siteData);
    document.getElementById("k_city").value = guessCity(siteData);
    renderKeywords(
      document.getElementById("k_service").value,
      document.getElementById("k_city").value,
      topTopics(siteData.text)
    );
    setMsg("Done — " + siteData.title.slice(0,60) + ". Switch tabs to explore both tools.");
  }).catch(function(){
    setMsg("Couldn't load that site automatically (many sites block automated fetches). Use the paste-HTML option below instead.");
  }).then(function(){
    go.disabled = false; go.textContent = "Analyze my site";
  });
}

document.getElementById("b_go").addEventListener("click", function(){
  var url = normalizeUrl(document.getElementById("b_url").value);
  if(!url){ setMsg("Please enter your website address first."); return; }
  runAnalysis(url, null);
});
document.getElementById("b_pasteGo").addEventListener("click", function(){
  var html = document.getElementById("b_paste").value;
  var url = normalizeUrl(document.getElementById("b_url").value) || "https://pasted-site.local/";
  runAnalysis(url, html);
});
document.getElementById("k_go").addEventListener("click", function(){
  var s = document.getElementById("k_service").value.trim();
  var c = document.getElementById("k_city").value.trim();
  renderKeywords(s, c, siteData ? topTopics(siteData.text) : []);
});
document.getElementById("b_url").addEventListener("keydown", function(e){
  if(e.key === "Enter"){ e.preventDefault(); document.getElementById("b_go").click(); }
});
document.getElementById("yr").textContent = new Date().getFullYear();
})();
