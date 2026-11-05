/* Recipe Search - plain JavaScript.
   Online: real recipes from the free TheMealDB API (https://www.themealdb.com).
   Offline / API down: falls back to the built-in SAMPLE recipes below. */
(function () {
  "use strict";

  var API = "https://www.themealdb.com/api/json/v1/1/";
  var FAV_KEY = "recipesearch.favs.v1";
  var FALLBACK_CATS = ["Beef", "Chicken", "Dessert", "Lamb", "Pasta", "Pork", "Seafood", "Side", "Starter", "Vegetarian", "Breakfast"];

  /* ---------- built-in sample recipes (used offline) ---------- */
  var SAMPLE = [
    { id: "s1", name: "Fluffy Pancakes", category: "Breakfast", area: "American", icon: "\uD83E\uDD5E",
      ingredients: [["Flour", "200 g"], ["Milk", "300 ml"], ["Eggs", "2"], ["Sugar", "2 tbsp"], ["Baking powder", "2 tsp"], ["Butter", "for frying"]],
      steps: ["Whisk the flour, sugar and baking powder in a bowl.", "Beat the eggs with the milk, then pour into the dry mix and stir until just combined.", "Heat a buttered pan over medium heat.", "Pour in a ladle of batter and cook until bubbles appear, about 2 minutes.", "Flip and cook 1 more minute. Serve warm with honey or fruit."] },
    { id: "s2", name: "Spaghetti Aglio e Olio", category: "Pasta", area: "Italian", icon: "\uD83C\uDF5D",
      ingredients: [["Spaghetti", "250 g"], ["Garlic", "4 cloves"], ["Olive oil", "5 tbsp"], ["Chilli flakes", "1 tsp"], ["Parsley", "small bunch"], ["Salt", "to taste"]],
      steps: ["Boil the spaghetti in salted water until al dente. Save a cup of the pasta water.", "Slice the garlic and warm it gently in the olive oil with the chilli flakes until golden.", "Add the drained pasta and a splash of pasta water; toss for 1 minute.", "Finish with chopped parsley and serve at once."] },
    { id: "s3", name: "Chicken Stir-Fry", category: "Chicken", area: "Chinese", icon: "\uD83C\uDF57",
      ingredients: [["Chicken breast", "400 g"], ["Bell peppers", "2"], ["Broccoli", "1 head"], ["Soy sauce", "3 tbsp"], ["Garlic", "3 cloves"], ["Ginger", "1 thumb"], ["Vegetable oil", "2 tbsp"]],
      steps: ["Slice the chicken and vegetables into thin strips.", "Heat the oil in a wok until very hot and cook the chicken for 4 to 5 minutes.", "Add garlic and ginger, then the vegetables, and stir-fry for 3 minutes.", "Pour in the soy sauce, toss well and serve with rice."] },
    { id: "s4", name: "Fresh Guacamole", category: "Starter", area: "Mexican", icon: "\uD83E\uDD51",
      ingredients: [["Ripe avocados", "3"], ["Lime", "1"], ["Red onion", "1/2"], ["Tomato", "1"], ["Coriander", "handful"], ["Salt", "to taste"]],
      steps: ["Mash the avocados with a fork, leaving some chunks.", "Stir in the lime juice, chopped onion, tomato and coriander.", "Season with salt and serve with tortilla chips."] },
    { id: "s5", name: "Creamy Tomato Soup", category: "Vegetarian", area: "British", icon: "\uD83C\uDF45",
      ingredients: [["Tomatoes", "800 g"], ["Onion", "1"], ["Garlic", "2 cloves"], ["Vegetable stock", "500 ml"], ["Cream", "3 tbsp"], ["Olive oil", "2 tbsp"]],
      steps: ["Soften the chopped onion and garlic in the oil for 5 minutes.", "Add the tomatoes and stock, then simmer for 20 minutes.", "Blend until smooth and stir in the cream.", "Season and serve with crusty bread."] },
    { id: "s6", name: "Ugali with Sukuma Wiki", category: "Side", area: "Kenyan", icon: "\uD83E\uDD6C",
      ingredients: [["Maize flour", "2 cups"], ["Water", "4 cups"], ["Collard greens (sukuma wiki)", "1 bunch"], ["Onion", "1"], ["Tomatoes", "2"], ["Cooking oil", "2 tbsp"], ["Salt", "to taste"]],
      steps: ["Bring the water to a boil, then add the maize flour gradually while stirring.", "Keep stirring and pressing until the ugali is thick and smooth, about 5 minutes.", "Fry the onion in oil, add the tomatoes and cook until soft.", "Add the shredded greens and salt; cook for 5 minutes.", "Serve the sukuma wiki with the ugali."] },
    { id: "s7", name: "Grilled Lemon Fish", category: "Seafood", area: "Mediterranean", icon: "\uD83D\uDC1F",
      ingredients: [["White fish fillets", "4"], ["Lemon", "2"], ["Olive oil", "3 tbsp"], ["Garlic", "2 cloves"], ["Oregano", "1 tsp"], ["Salt and pepper", "to taste"]],
      steps: ["Mix the oil, juice of 1 lemon, garlic and oregano.", "Coat the fish and rest for 15 minutes.", "Grill for 3 to 4 minutes per side until flaky.", "Serve with lemon wedges."] },
    { id: "s8", name: "Banana Oat Cookies", category: "Dessert", area: "American", icon: "\uD83C\uDF6A",
      ingredients: [["Ripe bananas", "2"], ["Rolled oats", "1 cup"], ["Honey", "2 tbsp"], ["Cinnamon", "1/2 tsp"], ["Raisins", "1/4 cup"]],
      steps: ["Heat the oven to 180C and line a tray.", "Mash the bananas and mix in the oats, honey, cinnamon and raisins.", "Spoon onto the tray and flatten slightly.", "Bake 15 minutes until golden."] }
  ];

  /* ---------- state ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var grid = $("grid"), noteEl = $("note"), headingEl = $("heading");
  var favs = loadFavs(), cache = {}, view = "discover", cat = "", token = 0, current = null, debounce;
  var offline = false;

  function loadFavs() {
    try { var v = JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); return Array.isArray(v) ? v.filter(function (f) { return f && f.id && f.name; }) : []; } catch (e) { return []; }
  }
  function saveFavs() { try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) {} }
  function isFav(id) { return favs.some(function (f) { return f.id === id; }); }

  /* ---------- helpers ---------- */
  function okUrl(u) { return typeof u === "string" && /^https:\/\//i.test(u); }
  var toastT;
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2200); }

  function api(path) {
    var ctl = ("AbortController" in window) ? new AbortController() : null, t = ctl && setTimeout(function () { ctl.abort(); }, 9000);
    return fetch(API + path, ctl ? { signal: ctl.signal } : undefined).then(function (r) {
      clearTimeout(t); if (!r.ok) throw new Error("http"); return r.json();
    }).catch(function (e) { clearTimeout(t); throw e; });
  }

  function norm(m) {
    var ing = [], i, n;
    for (i = 1; i <= 20; i++) { n = (m["strIngredient" + i] || "").trim(); if (n) ing.push({ name: n, measure: (m["strMeasure" + i] || "").trim() }); }
    return { id: String(m.idMeal), name: m.strMeal || "Untitled", thumb: m.strMealThumb || "", category: m.strCategory || "", area: m.strArea || "",
             steps: splitSteps(m.strInstructions || ""), ingredients: ing, youtube: m.strYoutube || "", source: m.strSource || "", full: !!m.strInstructions };
  }
  function splitSteps(text) {
    var parts = text.split(/\r?\n+/).map(function (s) { return s.trim(); }).filter(function (s) { return s && !/^(step\s*)?\d+[.:)]?$/i.test(s); });
    if (parts.length < 3 && text.length > 250) parts = text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z])/).map(function (s) { return s.trim(); }).filter(Boolean);
    return parts.map(function (s) { return s.replace(/^(step\s*)?\d+[.:)]\s*/i, ""); });
  }
  function fromSample(s) {
    return { id: s.id, name: s.name, thumb: "", icon: s.icon, category: s.category, area: s.area, steps: s.steps, full: true, sample: true,
             ingredients: s.ingredients.map(function (x) { return { name: x[0], measure: x[1] }; }), youtube: "", source: "" };
  }
  function sampleSearch(q, mode, c) {
    q = (q || "").toLowerCase();
    return SAMPLE.filter(function (s) {
      if (c && s.category.toLowerCase() !== c.toLowerCase()) return false;
      if (!q) return true;
      if (mode === "ingredient") return s.ingredients.some(function (x) { return x[0].toLowerCase().indexOf(q) > -1; });
      return s.name.toLowerCase().indexOf(q) > -1 || s.category.toLowerCase().indexOf(q) > -1 || s.area.toLowerCase().indexOf(q) > -1;
    }).map(fromSample);
  }

  /* ---------- rendering ---------- */
  function skeleton() { grid.textContent = ""; for (var i = 0; i < 8; i++) { var li = document.createElement("li"); li.className = "skel"; grid.appendChild(li); } }
  function setNote(text, warn) { noteEl.textContent = text || ""; noteEl.className = "note" + (warn ? " warn" : ""); }

  function render(list, emptyMsg) {
    grid.textContent = "";
    if (!list.length) { var li = document.createElement("li"); li.className = "empty"; li.textContent = emptyMsg || "No recipes found."; grid.appendChild(li); return; }
    list.forEach(function (m) {
      if (m.full) cache[m.id] = m;
      var li = document.createElement("li"); li.className = "card";
      var open = document.createElement("button"); open.type = "button"; open.className = "open"; open.setAttribute("aria-label", "Open " + m.name);
      var pic = document.createElement("div"); pic.className = "pic";
      if (okUrl(m.thumb)) { var img = document.createElement("img"); img.loading = "lazy"; img.alt = ""; img.src = m.thumb + (m.thumb.indexOf("themealdb.com") > -1 ? "/preview" : ""); img.onerror = function () { img.onerror = null; img.src = m.thumb; }; pic.appendChild(img); }
      else pic.textContent = m.icon || "\uD83C\uDF72";
      var tx = document.createElement("div"); tx.className = "ctext";
      var h = document.createElement("h3"); h.textContent = m.name;
      var p = document.createElement("p"); p.textContent = [m.category, m.area].filter(Boolean).join(" \u00B7 ") || "Tap to view";
      tx.appendChild(h); tx.appendChild(p); open.appendChild(pic); open.appendChild(tx);
      open.addEventListener("click", function () { openRecipe(m); });
      var hb = heartBtn(m); li.appendChild(open); li.appendChild(hb); grid.appendChild(li);
    });
  }
  function heartBtn(m, big) {
    var b = document.createElement("button"); b.type = "button"; b.className = "heart" + (big ? " big" : "");
    paintHeart(b, m); b.addEventListener("click", function (e) { e.stopPropagation(); toggleFav(m); paintHeart(b, m); if (current && current.id === m.id) paintHeart($("dFav"), m); if (view === "favs") showFavs(); });
    return b;
  }
  function paintHeart(b, m) { var on = isFav(m.id); b.textContent = on ? "\u2665" : "\u2661"; b.setAttribute("aria-pressed", on); b.setAttribute("aria-label", (on ? "Remove " : "Save ") + m.name + (on ? " from favourites" : " to favourites")); }
  function toggleFav(m) {
    if (isFav(m.id)) { favs = favs.filter(function (f) { return f.id !== m.id; }); toast("Removed from favourites"); }
    else { favs.push({ id: m.id, name: m.name, thumb: m.thumb || "", icon: m.icon || "", category: m.category || "", area: m.area || "", sample: !!m.sample }); toast("Saved to favourites"); }
    saveFavs(); $("favCount").textContent = favs.length;
  }

  /* ---------- search / browse ---------- */
  function runSearch(q, mode) {
    var my = ++token; view = "discover"; setTabs(); skeleton(); setNote("");
    var req, label;
    if (cat) { req = api("filter.php?c=" + encodeURIComponent(cat)); label = cat + " recipes"; }
    else if (mode === "ingredient" && q) { req = api("filter.php?i=" + encodeURIComponent(q.replace(/\s+/g, "_"))); label = "Recipes with \u201C" + q + "\u201D"; }
    else { req = api("search.php?s=" + encodeURIComponent(q)); label = q ? "Results for \u201C" + q + "\u201D" : "Popular recipes"; }
    req.then(function (d) {
      if (my !== token) return;
      offline = false; headingEl.textContent = label;
      var list = (d.meals || []).map(norm);
      if (cat && q) list = list.filter(function (m) { return m.name.toLowerCase().indexOf(q.toLowerCase()) > -1; });
      setNote(list.length ? list.length + " found" : "");
      render(list, "No recipes found. Try another word like chicken, rice or beef.");
    }).catch(function () {
      if (my !== token) return;
      offline = true; headingEl.textContent = (cat || q) ? label : "Sample recipes";
      setNote("Can't reach the recipe service. Showing built-in samples.", true);
      render(sampleSearch(q, mode, cat), "No sample recipes match. Connect to the internet for thousands more.");
    });
  }

  function loadCategories() {
    var box = $("chips");
    function paint(names) {
      box.textContent = "";
      ["All"].concat(names).forEach(function (n) {
        var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = n;
        b.setAttribute("aria-pressed", (n === "All" && !cat) || n === cat ? "true" : "false");
        b.addEventListener("click", function () { cat = n === "All" ? "" : n; if (cat) $("q").value = ""; paint(names); runSearch($("q").value.trim(), $("mode").value); });
        box.appendChild(b);
      });
    }
    paint(FALLBACK_CATS);
    api("categories.php").then(function (d) {
      var names = (d.categories || []).map(function (c) { return c.strCategory; }).filter(Boolean);
      if (names.length) paint(names);
    }).catch(function () {});
  }

  /* ---------- favourites view ---------- */
  function showFavs() {
    view = "favs"; setTabs(); token++;
    var q = $("q").value.trim().toLowerCase();
    var list = favs.filter(function (f) { return !q || f.name.toLowerCase().indexOf(q) > -1; });
    headingEl.textContent = "Your favourites"; setNote(favs.length ? list.length + " saved" : "");
    render(list, favs.length ? "No favourites match your search." : "Nothing saved yet. Tap the heart on any recipe.");
  }
  function setTabs() {
    $("tabDiscover").setAttribute("aria-pressed", view === "discover"); $("tabFavs").setAttribute("aria-pressed", view === "favs");
    $("chips").hidden = view === "favs";
  }
  $("tabDiscover").addEventListener("click", function () { runSearch($("q").value.trim(), $("mode").value); });
  $("tabFavs").addEventListener("click", showFavs);

  /* ---------- recipe dialog ---------- */
  var dlg = $("dlg");
  function openRecipe(m) {
    if (m.full) return showDetail(m);
    if (cache[m.id]) return showDetail(cache[m.id]);
    if (/^s\d+$/.test(m.id)) { var s = SAMPLE.filter(function (x) { return x.id === m.id; })[0]; if (s) return showDetail(fromSample(s)); }
    toast("Loading recipe...");
    api("lookup.php?i=" + encodeURIComponent(m.id)).then(function (d) {
      if (!d.meals || !d.meals[0]) throw new Error("none");
      var full = norm(d.meals[0]); cache[full.id] = full; showDetail(full);
    }).catch(function () { toast("Could not load this recipe. Check your connection."); });
  }

  function showDetail(m) {
    current = m;
    var img = $("dImg"); img.textContent = "";
    if (okUrl(m.thumb)) { var i = document.createElement("img"); i.alt = m.name; i.src = m.thumb; img.appendChild(i); } else img.textContent = m.icon || "\uD83C\uDF72";
    $("dTitle").textContent = m.name;
    var meta = $("dMeta"); meta.textContent = "";
    [m.category, m.area].filter(Boolean).forEach(function (t) { var s = document.createElement("span"); s.className = "tag"; s.textContent = t; meta.appendChild(s); });
    paintHeart($("dFav"), m);

    var ul = $("dIngs"); ul.textContent = "";
    m.ingredients.forEach(function (x, idx) {
      var li = document.createElement("li"), lb = document.createElement("label"), cb = document.createElement("input"), sp = document.createElement("span"), b = document.createElement("b");
      cb.type = "checkbox"; cb.id = "ing" + idx; b.textContent = x.measure ? x.measure + " " : ""; sp.appendChild(b); sp.appendChild(document.createTextNode(x.name));
      lb.appendChild(cb); lb.appendChild(sp); li.appendChild(lb); ul.appendChild(li);
    });
    var ol = $("dSteps"); ol.textContent = "";
    (m.steps.length ? m.steps : ["No instructions available."]).forEach(function (t) { var li = document.createElement("li"), p = document.createElement("span"); p.textContent = t; li.appendChild(p); ol.appendChild(li); });
    var links = $("dLinks"); links.textContent = "";
    if (okUrl(m.youtube)) links.appendChild(link(m.youtube, "\u25B6 Watch video", "yt"));
    if (okUrl(m.source)) links.appendChild(link(m.source, "View original recipe"));
    links.hidden = !links.childNodes.length;

    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    $("detail") && 0; dlg.scrollTop = 0; var d = dlg.querySelector(".detail"); if (d) d.scrollTop = 0;
  }
  function link(href, text, cls) { var a = document.createElement("a"); a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = text; if (cls) a.className = cls; return a; }

  $("dClose").addEventListener("click", function () { dlg.close ? dlg.close() : dlg.removeAttribute("open"); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });   // click on backdrop
  $("dFav").addEventListener("click", function () {
    if (!current) return; toggleFav(current); paintHeart($("dFav"), current); if (view === "favs") showFavs(); else render_refreshHearts();
  });
  function render_refreshHearts() {
    var cards = grid.querySelectorAll(".card");
    // re-render the visible list cheaply by toggling heart buttons
    Array.prototype.forEach.call(cards, function (c) {
      var name = c.querySelector("h3").textContent, b = c.querySelector(".heart");
      var on = favs.some(function (f) { return f.name === name; }); b.textContent = on ? "\u2665" : "\u2661"; b.setAttribute("aria-pressed", on);
    });
  }
  $("copyBtn").addEventListener("click", function () {
    if (!current) return;
    var text = current.name + "\n" + current.ingredients.map(function (x) { return "- " + (x.measure ? x.measure + " " : "") + x.name; }).join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast("Ingredient list copied"); }, function () { toast("Could not copy"); });
    else toast("Copy is not available here");
  });

  /* ---------- search form, random ---------- */
  $("searchForm").addEventListener("submit", function (e) {
    e.preventDefault(); clearTimeout(debounce);
    if (view === "favs") return showFavs();
    cat = ""; loadCategories(); runSearch($("q").value.trim(), $("mode").value);
  });
  $("q").addEventListener("input", function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      if (view === "favs") return showFavs();
      var v = $("q").value.trim(); if (v.length >= 3 || v.length === 0) { cat = ""; runSearch(v, $("mode").value); }
    }, 500);
  });
  $("mode").addEventListener("change", function () { if (view === "discover" && $("q").value.trim()) runSearch($("q").value.trim(), this.value); });
  $("randomBtn").addEventListener("click", function () {
    toast("Picking something tasty...");
    api("random.php").then(function (d) { var m = norm(d.meals[0]); cache[m.id] = m; showDetail(m); })
      .catch(function () { var s = fromSample(SAMPLE[Math.floor(Math.random() * SAMPLE.length)]); showDetail(s); toast("Offline: showing a sample recipe"); });
  });

  $("favCount").textContent = favs.length;
  loadCategories();
  runSearch("chicken", "name");
  headingEl.textContent = "Popular: chicken recipes";
})();
