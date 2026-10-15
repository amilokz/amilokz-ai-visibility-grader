/* roast.js — Roast Mode for the AI Visibility Grader.
   Same 12-check engine, savage-but-helpful personality. 100% client-side, no API calls.
   Check order matches runChecks() in grader.js (index 0..11). */
(function(){
"use strict";

var OVERALL = {
  A: "Certified show-off. Your site is so AI-ready that ChatGPT probably recommends you in its sleep. Honestly? There's almost nothing to roast here — and that mildly annoys me.",
  B: "Solid. Suspiciously solid. A few cracks in the armor though — scroll down and I'll point at them dramatically.",
  C: "Painfully mid. Your website is the \u201CI'll start my diet on Monday\u201D of AI visibility. Fixable — but right now AI assistants are swiping left.",
  D: "Yikes. Your site is playing hide-and-seek with AI assistants\u2026 and winning. Good news: there's nowhere to go but up.",
  F: "Brutal truth: AI assistants have never heard of you — and after seeing this, I get it. But every comeback story starts at rock bottom. Let's climb."
};

/* fail roasts, indexed to runChecks() order */
var FAIL_ROAST = [
  "No Schema markup? So Google has to GUESS what your business does. Bold strategy. Doesn't work.",
  "Zero FAQs on the site. When customers ask questions, your website just stares blankly. AI assistants notice \u2014 and they judge.",
  "Your page title is {v}. That's not a title, that's a cry for help.",
  "No meta description. When AI has to describe your business, it just makes awkward small talk.",
  "No main headline (H1). Your homepage opens like a movie with no title \u2014 confusing, and easy to walk out of.",
  "No phone number found anywhere. Quick question: do you WANT customers to call you? Asking for a friend. The friend is your revenue.",
  "No address on the site. Are you a real business or a beautiful mystery? AI assistants don't recommend mysteries.",
  "Not on HTTPS. It's 2026 and your site still sends data like it's 2006. Browsers are judging you. Visitors too.",
  "No reviews or testimonials anywhere. \u201CTrust me bro\u201D is not a marketing strategy.",
  "No About page. Who ARE you? AI is asking. Your visitors are asking. Nobody knows.",
  "No contact page. You built a website with no way to contact you. That's not a website, that's a poster.",
  "No fresh content, no blog, no dates. Your last update might qualify for carbon dating."
];

/* warn roasts (milder), indexed the same */
var WARN_ROAST = [
  "Schema markup exists but it's shy. Give it the full LocalBusiness treatment.",
  "FAQ-ish content detected, but it's hiding. Put it where humans (and AI) can find it.",
  "Your title exists but it's {v} \u2014 aim for 30\u201360 characters. Goldilocks it.",
  "Meta description exists but it's {v}. 120\u2013160 characters is the sweet spot.",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "Freshness signals are weak \u2014 a blog link here, a date there. Post something. Anything. AI likes signs of life."
];

var PASS_QUIP = [
  "Schema markup present. Look at you, speaking Google's love language.",
  "FAQ content found. AI assistants love a site that answers questions.",
  "Title tag on point. Chef's kiss.",
  "Meta description doing its job.",
  "Clear H1. AI knows what you do at a glance.",
  "Phone number visible. Customers can actually reach you \u2014 revolutionary.",
  "Address detected. You exist in physical space. Bold.",
  "HTTPS secured. Living in the current decade.",
  "Reviews on display. Social proof doing push-ups.",
  "About page linked. Mystery solved.",
  "Contact page present. Reachable. What a concept.",
  "Fresh content signals. Your site looks alive."
];

function esc(s){
  return String(s==null?"":s).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}

function roastLine(check, i){
  var v = "";
  if(i===2){ var m=/(\d+)\s*characters/.exec(check.detail||""); v = m? m[1]+" characters long" : "a weird length"; }
  if(i===3){ var m2=/(\d+)\s*characters/.exec(check.detail||""); v = m2? m2[1]+" characters" : "off"; }
  var tpl = check.status==="fail" ? FAIL_ROAST[i] : (check.status==="warn" ? WARN_ROAST[i] : PASS_QUIP[i]);
  if(!tpl) tpl = check.status==="pass" ? "Passed. Fine. Moving on." : check.detail;
  return tpl.replace("{v}", v);
}

function firstSentence(s){
  var m = /^[^.!?]+[.!?]/.exec(s||"");
  return m ? m[0] : (s||"");
}

function shareText(res){
  return "\uD83D\uDD25 My website just got ROASTED by AI\n" +
    res.domain + " \u2014 Grade " + res.grade + " (" + res.score + "/100)\n" +
    "\u201C" + firstSentence(OVERALL[res.grade]||"") + "\u201D\n" +
    "Think YOUR site can take the heat? \uD83D\uDC49 https://aigrader.akclnt.com/";
}

function renderInto(el, res){
  var fails = [], warns = [], passes = [];
  res.checks.forEach(function(c, i){
    var item = {check:c, i:i, line:roastLine(c, i)};
    if(c.status==="fail") fails.push(item);
    else if(c.status==="warn") warns.push(item);
    else passes.push(item);
  });

  var h = '';
  h += '<div class="roast-hero">';
  h += '<div class="roast-flame">\uD83D\uDD25</div>';
  h += '<div class="roast-head"><span class="roast-kicker">ROAST REPORT</span>';
  h += '<h2>'+esc(res.domain)+'</h2>';
  h += '<div class="roast-grade" style="--rc:'+AVG.gradeColor(res.grade)+'"><span class="rg-num">'+res.score+'</span><span class="rg-let">Grade '+res.grade+'</span></div></div>';
  h += '<p class="roast-overall">'+esc(OVERALL[res.grade]||"")+'</p>';
  h += '<div class="roast-counts"><span class="rc bad">'+fails.length+' roasted</span><span class="rc warn">'+warns.length+' mildly burnt</span><span class="rc ok">'+passes.length+' survived</span></div>';
  h += '</div>';

  if(fails.length){
    h += '<h3 class="roast-sec">\uD83D\uDD25 The roast</h3><div class="roast-list">';
    fails.forEach(function(it){
      h += '<div class="roast-item fail"><div class="rl">'+esc(it.line)+'</div>' +
           '<div class="rfix"><b>Fix it:</b> '+esc(it.check.fix)+'</div></div>';
    });
    h += '</div>';
  }
  if(warns.length){
    h += '<h3 class="roast-sec">\uD83D\uDE05 Lightly toasted</h3><div class="roast-list">';
    warns.forEach(function(it){
      h += '<div class="roast-item warn"><div class="rl">'+esc(it.line)+'</div>' +
           '<div class="rfix"><b>Fix it:</b> '+esc(it.check.fix)+'</div></div>';
    });
    h += '</div>';
  }
  if(passes.length){
    h += '<details class="roast-passes"><summary>'+passes.length+' things you didn\u2019t mess up (click to gloat)</summary><div class="roast-list">';
    passes.forEach(function(it){
      h += '<div class="roast-item pass"><div class="rl">'+esc(it.line)+'</div></div>';
    });
    h += '</div></details>';
  }

  /* shareable roast card */
  h += '<div class="roast-card" id="roastCard">';
  h += '<div class="rc-flame">\uD83D\uDD25</div>';
  h += '<div class="rc-domain">'+esc(res.domain)+'</div>';
  h += '<div class="rc-grade" style="color:'+AVG.gradeColor(res.grade)+'">Grade '+res.grade+' <span>'+res.score+'/100</span></div>';
  h += '<div class="rc-line">\u201C'+esc(firstSentence(OVERALL[res.grade]||""))+'\u201D</div>';
  h += '<div class="rc-foot">Roasted by the AI Visibility Grader \u00B7 aigrader.akclnt.com</div>';
  h += '</div>';
  h += '<div class="roast-share">';
  h += '<button class="btn btn-accent btn-sm" id="copyRoast">\uD83D\uDCCB Copy roast text</button> ';
  h += '<a class="btn btn-ghost btn-sm" id="shareX" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText(res))+'">Share on X</a> ';
  h += '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent("https://aigrader.akclnt.com/")+'">Share on LinkedIn</a>';
  h += '</div>';

  /* serious breakdown for people who want the real fixes */
  h += '<details class="roast-passes"><summary>Nerd view: the serious breakdown</summary><div class="checks">';
  h += res.checks.map(function(c){
    return '<div class="check '+c.status+'"><div class="ctop">'+AVG.iconFor(c.status)+
      '<span class="cname">'+esc(c.name)+'</span><span class="badge '+c.status+'">'+AVG.badgeFor(c.status)+'</span></div>'+
      '<div class="why">'+esc(c.detail)+'</div>'+
      (c.status!=="pass" ? '<div class="fix"><b>Fix:</b> '+esc(c.fix)+'</div>' : '')+'</div>';
  }).join("");
  h += '</div></details>';

  el.innerHTML = h;

  var cp = document.getElementById("copyRoast");
  if(cp) cp.addEventListener("click", function(){
    var done = function(){
      cp.textContent = "Copied! Go embarrass yourself publicly \uD83D\uDE04";
      setTimeout(function(){ cp.textContent = "\uD83D\uDCCB Copy roast text"; }, 2200);
    };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(shareText(res)).then(done, done);
    } else { done(); }
  });
}

window.Roast = { renderInto:renderInto, shareText:shareText };
})();
