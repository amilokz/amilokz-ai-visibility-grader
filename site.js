/* site.js — shared: light/dark theme toggle + reveal-on-scroll animations.
   A tiny init snippet in <head> applies the saved theme before first paint. */
(function(){
"use strict";
document.documentElement.classList.add("js");

/* ---------- theme toggle ---------- */
var btn = document.getElementById("themeBtn");
function current(){
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}
function paint(){
  if(btn) btn.textContent = current() === "light" ? "\u2600\uFE0F" : "\uD83C\uDF19";
}
function setTheme(t){
  if(t === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  try{ localStorage.setItem("avg_theme", t); }catch(e){}
  paint();
}
if(btn) btn.addEventListener("click", function(){
  setTheme(current() === "light" ? "dark" : "light");
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
