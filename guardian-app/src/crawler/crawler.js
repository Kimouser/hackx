// ============================================================
//  Project Guardian — Web Crawler
//  Scrapes Mumbai crime/safety news and pushes to Supabase.
//
//  Dependencies:  npm install axios cheerio @supabase/supabase-js dotenv
//  Usage:         node crawler.js
//  Env file:      .env  (SUPABASE_URL, SUPABASE_SERVICE_KEY)
// ============================================================

"use strict";

require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { createClient } = require("@supabase/supabase-js");

// ─────────────────────────────────────────────
// 1.  SUPABASE CLIENT
// ─────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // Use the service-role key server-side
);

// ─────────────────────────────────────────────
// 2.  MUMBAI VIEWPORT  (bounding box)
// ─────────────────────────────────────────────
const MUMBAI_BOUNDS = {
  latMin: 18.90,
  latMax: 19.30,
  lngMin: 72.75,
  lngMax: 73.00,
};

// ─────────────────────────────────────────────
// 3.  HEURISTIC GEOCODING TABLE
//     Add more localities as the project grows.
// ─────────────────────────────────────────────
const LOCATION_COORDS = {
  // === Primary focus area ===
  vidyavihar:   { lat: 19.0771, lng: 72.9067 },
  ghatkopar:    { lat: 19.0862, lng: 72.9078 },
  somaiya:      { lat: 19.0746, lng: 72.9003 },

  // === Nearby areas ===
  kurla:        { lat: 19.0728, lng: 72.8792 },
  vikhroli:     { lat: 19.1057, lng: 72.9266 },
  bhandup:      { lat: 19.1439, lng: 72.9399 },
  powai:        { lat: 19.1197, lng: 72.9069 },
  chembur:      { lat: 19.0622, lng: 72.9012 },
  mulund:       { lat: 19.1763, lng: 72.9561 },
  thane:        { lat: 19.2183, lng: 72.9781 },

  // === Western suburbs ===
  andheri:      { lat: 19.1136, lng: 72.8697 },
  bandra:       { lat: 19.0596, lng: 72.8295 },
  borivali:     { lat: 19.2307, lng: 72.8567 },
  malad:        { lat: 19.1874, lng: 72.8482 },
  kandivali:    { lat: 19.2053, lng: 72.8496 },
  goregaon:     { lat: 19.1581, lng: 72.8501 },
  jogeshwari:   { lat: 19.1388, lng: 72.8491 },
  vile_parle:   { lat: 19.0990, lng: 72.8497 },

  // === South Mumbai ===
  dadar:        { lat: 19.0176, lng: 72.8432 },
  dharavi:      { lat: 19.0380, lng: 72.8553 },
  sion:         { lat: 19.0397, lng: 72.8699 },
  worli:        { lat: 19.0168, lng: 72.8167 },
  lower_parel:  { lat: 18.9939, lng: 72.8262 },
  colaba:       { lat: 18.9067, lng: 72.8147 },
  fort:         { lat: 18.9345, lng: 72.8351 },
  churchgate:   { lat: 18.9354, lng: 72.8272 },
  cst:          { lat: 18.9399, lng: 72.8355 },

  // === Generic terms ===
  station:      { lat: 19.0771, lng: 72.9067 },   // defaults to Vidyavihar station
  mumbai:       { lat: 19.0760, lng: 72.8777 },
};

/**
 * Returns {lat, lng} for a given news text using keyword matching.
 * Falls back to a random point inside the Mumbai bounding box.
 * @param {string} text - Combined title + description text to search.
 * @returns {{ lat: number, lng: number }}
 */
function geocodeFromText(text) {
  const lower = text.toLowerCase();

  // Iterate the lookup table; first match wins
  for (const [keyword, coords] of Object.entries(LOCATION_COORDS)) {
    // Replace underscores so "vile_parle" matches "vile parle"
    const term = keyword.replace(/_/g, " ");
    if (lower.includes(term)) {
      // Add tiny random jitter (±~500 m) so markers don't pile up exactly
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.009,
        lng: coords.lng + (Math.random() - 0.5) * 0.009,
      };
    }
  }

  // Fallback — random point within Mumbai viewport
  const { latMin, latMax, lngMin, lngMax } = MUMBAI_BOUNDS;
  return {
    lat: latMin + Math.random() * (latMax - latMin),
    lng: lngMin + Math.random() * (lngMax - lngMin),
  };
}

// ─────────────────────────────────────────────
// 4.  CATEGORY CLASSIFIER
//     Simple keyword → category mapping.
// ─────────────────────────────────────────────
const CATEGORY_RULES = [
  { keywords: ["eve-teasing", "harassment", "molest", "stalk", "assault", "rape", "grope"], category: "harassment" },
  { keywords: ["dark", "streetlight", "light out", "no light", "pothole", "broken", "road", "infrastructure"], category: "broken_lights" },
  { keywords: ["robbery", "theft", "chain snatching", "mugging", "pickpocket", "burglar", "dacoity"], category: "unsafe_area" },
  { keywords: ["alert", "warning", "flood", "fire", "bomb", "terror", "protest", "riot", "curfew"], category: "safety_alert" },
];

/**
 * Classifies an article into one of the Guardian categories.
 * @param {string} text - Combined title + description.
 * @returns {string} category
 */
function classifyCategory(text) {
  const lower = text.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.category;
    }
  }
  // Default — generic unsafe area if it passed safety filters
  return "unsafe_area";
}

// ─────────────────────────────────────────────
// 5.  NEWS SOURCE DEFINITIONS
//     Each source has a custom scrape() function
//     that returns an array of { title, description }.
// ─────────────────────────────────────────────

/**
 * Generic helper: fetch a URL with a browser-like User-Agent.
 * @param {string} url
 * @returns {Promise<cheerio.CheerioAPI>}
 */
async function fetchPage(url) {
  const { data } = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  return cheerio.load(data);
}

// ── 5a. Mid-Day (Mumbai) ──────────────────────
async function scrapeMidDay() {
  const articles = [];
  try {
    const $ = await fetchPage("https://www.mid-day.com/mumbai/mumbai-crime-news");
    $("article, .listing-item, .news-card").each((_, el) => {
      const title = $(el).find("h2, h3, .title").first().text().trim();
      const description = $(el).find("p, .summary, .excerpt").first().text().trim();
      if (title) articles.push({ title, description: description || title });
    });
  } catch (err) {
    console.warn("[Mid-Day] Scrape failed:", err.message);
  }
  return articles;
}

// ── 5b. Times of India — Mumbai Crime ────────
async function scrapeTOI() {
  const articles = [];
  try {
    // TOI's search RSS for Mumbai crime news
    const $ = await fetchPage(
      "https://timesofindia.indiatimes.com/city/mumbai/crime"
    );
    // TOI article cards generally carry class "col_l_6" or ".top-story"
    $("li.clearfix, .article-storyCont, .top-story, [data-articlid]").each((_, el) => {
      const title = $(el).find("a, span.title, .story-title").first().text().trim();
      const description = $(el).find("p, .synopsis").first().text().trim();
      if (title) articles.push({ title, description: description || title });
    });
  } catch (err) {
    console.warn("[TOI] Scrape failed:", err.message);
  }
  return articles;
}

// ── 5c. Free Press Journal ───────────────────
async function scrapeFPJ() {
  const articles = [];
  try {
    const $ = await fetchPage(
      "https://www.freepressjournal.in/mumbai/crime"
    );
    $("article, .post-content-area, .section-listing__item").each((_, el) => {
      const title = $(el).find("h2, h3, .entry-title, a").first().text().trim();
      const description = $(el).find("p, .entry-summary").first().text().trim();
      if (title) articles.push({ title, description: description || title });
    });
  } catch (err) {
    console.warn("[FPJ] Scrape failed:", err.message);
  }
  return articles;
}

// ── 5d. Hindustan Times — Mumbai ─────────────
async function scrapeHindustanTimes() {
  const articles = [];
  try {
    const $ = await fetchPage(
      "https://www.hindustantimes.com/cities/mumbai-news/crime"
    );
    $(".cartHolder, .storyShortDetail, article").each((_, el) => {
      const title = $(el).find("h2, h3, .hdg3, a.storyLink").first().text().trim();
      const description = $(el).find("p, .sortDes").first().text().trim();
      if (title) articles.push({ title, description: description || title });
    });
  } catch (err) {
    console.warn("[HT] Scrape failed:", err.message);
  }
  return articles;
}

// ── 5e. Mumbai Mirror / Mumbai Live (RSS) ─────
async function scrapeMumbaiLive() {
  const articles = [];
  try {
    // Mumbai Live exposes an RSS feed — easier to parse reliably
    const $ = await fetchPage("https://www.mumbailive.com/en/crime");
    $("article, .news-listing__item, .card").each((_, el) => {
      const title = $(el).find("h2, h3, .card-title").first().text().trim();
      const description = $(el).find("p, .card-text").first().text().trim();
      if (title) articles.push({ title, description: description || title });
    });
  } catch (err) {
    console.warn("[Mumbai Live] Scrape failed:", err.message);
  }
  return articles;
}

// ─────────────────────────────────────────────
// 6.  SAFETY FILTER
//     We only want safety/crime-relevant articles.
// ─────────────────────────────────────────────
const SAFETY_KEYWORDS = [
  "crime", "theft", "robbery", "murder", "rape", "assault", "molestation",
  "harassment", "kidnap", "acid", "stalking", "snatching", "fraud", "scam",
  "accident", "fire", "flood", "blast", "terror", "alert", "curfew",
  "protest", "riot", "dark", "street light", "pothole", "unsafe", "police",
  "arrested", "fir", "case registered", "victim", "dead body", "missing",
];

/**
 * Returns true if the article text contains at least one safety keyword.
 */
function isSafetyRelevant(title, description) {
  const combined = `${title} ${description}`.toLowerCase();
  return SAFETY_KEYWORDS.some((kw) => combined.includes(kw));
}

// ─────────────────────────────────────────────
// 7.  DEDUPLICATION
//     Fetch existing titles from Supabase and
//     return a Set for O(1) lookups.
// ─────────────────────────────────────────────
async function fetchExistingTitles() {
  const { data, error } = await supabase
    .from("reports")
    .select("title")
    .order("created_at", { ascending: false })
    .limit(500);                              // Check last 500 records

  if (error) {
    console.error("[Supabase] Could not fetch existing titles:", error.message);
    return new Set();
  }

  return new Set(data.map((r) => r.title.toLowerCase().trim()));
}

// ─────────────────────────────────────────────
// 8.  BATCH INSERT
// ─────────────────────────────────────────────
async function insertReports(reports) {
  if (reports.length === 0) {
    console.log("[Supabase] Nothing new to insert.");
    return;
  }

  const { error } = await supabase.from("reports").insert(reports);
  if (error) {
    console.error("[Supabase] Insert error:", error.message);
  } else {
    console.log(`[Supabase] ✅ Inserted ${reports.length} new report(s).`);
  }
}

// ─────────────────────────────────────────────
// 9.  MAIN ORCHESTRATOR
// ─────────────────────────────────────────────
async function runCrawler() {
  console.log("=".repeat(55));
  console.log(" 🕷️  Project Guardian — Crawler Starting");
  console.log("=".repeat(55));

  // ── 9a. Validate environment variables ──
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error(
      "[Config] ❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env"
    );
    process.exit(1);
  }

  // ── 9b. Scrape all sources in parallel ──
  console.log("\n[Crawler] Scraping all sources in parallel…");
  const [midday, toi, fpj, ht, ml] = await Promise.allSettled([
    scrapeMidDay(),
    scrapeTOI(),
    scrapeFPJ(),
    scrapeHindustanTimes(),
    scrapeMumbaiLive(),
  ]);

  // Flatten results; handle any rejected promises gracefully
  const raw = [
    ...(midday.status === "fulfilled" ? midday.value : []),
    ...(toi.status    === "fulfilled" ? toi.value    : []),
    ...(fpj.status    === "fulfilled" ? fpj.value    : []),
    ...(ht.status     === "fulfilled" ? ht.value     : []),
    ...(ml.status     === "fulfilled" ? ml.value     : []),
  ];

  console.log(`[Crawler] Raw articles collected: ${raw.length}`);

  // ── 9c. Filter for safety relevance ──
  const relevant = raw.filter(({ title, description }) =>
    isSafetyRelevant(title, description)
  );
  console.log(`[Crawler] Safety-relevant articles: ${relevant.length}`);

  // ── 9d. Load existing titles for deduplication ──
  console.log("[Supabase] Fetching existing titles for deduplication…");
  const existingTitles = await fetchExistingTitles();
  console.log(`[Supabase] Existing records checked: ${existingTitles.size}`);

  // ── 9e. Build report objects ──
  const seenInBatch = new Set();           // Prevent duplicates within this run
  const toInsert = [];

  for (const { title, description } of relevant) {
    const normalizedTitle = title.toLowerCase().trim();

    // Skip if already in DB or seen in this batch
    if (existingTitles.has(normalizedTitle) || seenInBatch.has(normalizedTitle)) {
      continue;
    }
    seenInBatch.add(normalizedTitle);

    const combined = `${title} ${description}`;
    const { lat, lng } = geocodeFromText(combined);
    const category = classifyCategory(combined);

    // Clamp coordinates to Mumbai bounds (safety net)
    const safeLat = Math.max(MUMBAI_BOUNDS.latMin, Math.min(MUMBAI_BOUNDS.latMax, lat));
    const safeLng = Math.max(MUMBAI_BOUNDS.lngMin, Math.min(MUMBAI_BOUNDS.lngMax, lng));

    toInsert.push({
      title: title.substring(0, 255),          // Guard against overly long titles
      category,
      description: description.substring(0, 500),
      lat: parseFloat(safeLat.toFixed(6)),
      lng: parseFloat(safeLng.toFixed(6)),
      upvotes: 0,
      status: "active",
    });
  }

  console.log(`[Crawler] New unique reports to insert: ${toInsert.length}`);

  // ── 9f. Insert into Supabase ──
  await insertReports(toInsert);

  console.log("\n" + "=".repeat(55));
  console.log(" ✅ Crawler run complete.");
  console.log("=".repeat(55));
}

// ─────────────────────────────────────────────
// 10.  ENTRY POINT
// ─────────────────────────────────────────────
runCrawler().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});