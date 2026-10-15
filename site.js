/* site.js — shared: light/dark theme toggle + reveal-on-scroll animations.
   A tiny init snippet in <head> applies the saved theme before first paint. */
(function(){
"use strict";
document.documentElement.classList.add("js");

/* ---------- theme toggle ---------- */
var btn = document.getElementById("themeBtn");
function current(){
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
function paint(){
  if(btn) btn.textContent = current() === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
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
