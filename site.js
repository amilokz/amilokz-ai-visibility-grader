/* site.js — shared: light/dark theme toggle + reveal-on-scroll animations.
   A tiny init snippet in <head> applies the saved theme before first paint. */
(function(){
"use strict";
document.documentElement.classList.add("js");

/* ---------- theme toggle ---------- */
var btn = document.getElementById("themeBtn");
var ICON_MOON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
var ICON_SUN = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
function current(){
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
function paint(){
  if(btn) btn.innerHTML = current() === "dark" ? ICON_SUN : ICON_MOON;
}
function setTheme(t){
  if(t === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
  try{ localStorage.setItem("avg_theme", t); }catch(e){}
  paint();
}
if(btn) btn.addEventListener("click", function(){
  setTheme(current() === "dark" ? "light" : "dark");
});
paint();

/* ---------- reveal on scroll ---------- */
var els = document.querySelectorAll(".reveal");
if("IntersectionObserver" in window){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, {threshold: 0.1, rootMargin: "0px 0px -30px 0px"});
  els.forEach(function(el){ io.observe(el); });
}else{
  els.forEach(function(el){ el.classList.add("in"); });
}
})();

/* count-up stats */
(function(){
  var els = document.querySelectorAll("[data-count]");
  if(!els.length) return;
  if(!("IntersectionObserver" in window)){
    els.forEach(function(el){ el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || ""); });
    return;
  }
  var done = new WeakSet();
  function animate(el){
    if(done.has(el)) return; done.add(el);
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1200, t0 = null;
    function step(ts){
      if(!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ animate(e.target); io.unobserve(e.target); } });
  }, {threshold:.4});
  els.forEach(function(el){ io.observe(el); });
})();

/* ---------- mobile menu ---------- */
(function(){
  var burger = document.getElementById("burger"),
      menu = document.getElementById("mobileMenu");
  if(!burger || !menu) return;
  burger.addEventListener("click", function(){
    var open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  menu.addEventListener("click", function(e){
    if(e.target.closest("a")){
      menu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    }
  });
})();

/* ---------- header CTA appears after hero ---------- */
(function(){
  var cta = document.getElementById("headerCta");
  var hero = document.querySelector(".hero-split") || document.querySelector(".page-hero") || document.querySelector(".hero");
  if(!cta || !hero || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function(es){
    cta.classList.toggle("show", !es[0].isIntersecting);
  }, {threshold: 0});
  io.observe(hero);
})();

/* ---------- roast-mode CTAs (delegated) ---------- */
document.addEventListener("click", function(e){
  var t = e.target.closest("[data-activate-roast]");
  if(!t) return;
  e.preventDefault();
  var pill = document.getElementById("modeRoast");
  if(pill) pill.click();
  var g = document.getElementById("grader");
  if(g) g.scrollIntoView({behavior:"smooth", block:"start"});
});

/* ---------- hero entrance (masked rise + unblur) ---------- */
(function(){
  if(!document.querySelector(".hero-split")) return;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.body.classList.add("hprep");
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      document.body.classList.add("hready");
    });
  });
})();

/* ---------- magnetic primary CTA ---------- */
(function(){
  var mag = document.querySelector(".hero-ctas .magnetic");
  if(!mag || !window.matchMedia("(pointer:fine)").matches) return;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var strength = 14, raf = null;
  mag.addEventListener("mousemove", function(e){
    var r = mag.getBoundingClientRect();
    var x = e.clientX - r.left - r.width/2, y = e.clientY - r.top - r.height/2;
    if(raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function(){
      mag.style.transform = "translate(" + (x/r.width*strength).toFixed(1) + "px," + (y/r.height*strength).toFixed(1) + "px)";
    });
  });
  mag.addEventListener("mouseleave", function(){
    if(raf) cancelAnimationFrame(raf);
    mag.style.transform = "";
  });
})();
