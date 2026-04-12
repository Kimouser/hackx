// ============================================================
//  Project Guardian — Web Crawler  v2  (RSS-First Architecture)
//  Scrapes Mumbai crime/safety news and pushes to Supabase.
//
//  WHY RSS?  HTML scrapers break when sites change their markup
//  or add bot protection. RSS feeds are:
//    ✅ Deliberately public & stable
//    ✅ Structured XML — no selector guessing
//    ✅ Served without Cloudflare / JS-rendering gates
//
//  Dependencies:
//    npm install axios cheerio @supabase/supabase-js dotenv
//
//  Usage:   node crawler.js
//  Env:     .env  →  SUPABASE_URL, SUPABASE_SERVICE_KEY
// ============================================================

"use strict";

require("dotenv").config();
const axios   = require("axios");
const cheerio = require("cheerio");
const { createClient } = require("@supabase/supabase-js");

// ─────────────────────────────────────────────────────────────
// 1.  SUPABASE CLIENT
// ─────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service-role key — server-side only
);

// ─────────────────────────────────────────────────────────────
// 2.  MUMBAI BOUNDING BOX
// ─────────────────────────────────────────────────────────────
const MUMBAI_BOUNDS = {
  latMin: 18.90, latMax: 19.30,
  lngMin: 72.75, lngMax: 73.00,
};

// ─────────────────────────────────────────────────────────────
// 3.  HEURISTIC GEOCODING TABLE
//     Ordered by specificity (specific first, catch-alls last).
// ─────────────────────────────────────────────────────────────
const LOCATION_COORDS = [
  // ── Primary focus area ───────────────────────────────────────
  { term: "vidyavihar",    lat: 19.0771, lng: 72.9067 },
  { term: "ghatkopar",     lat: 19.0862, lng: 72.9078 },
  { term: "somaiya",       lat: 19.0746, lng: 72.9003 },
  // ── Eastern suburbs ──────────────────────────────────────────
  { term: "kurla",         lat: 19.0728, lng: 72.8792 },
  { term: "vikhroli",      lat: 19.1057, lng: 72.9266 },
  { term: "bhandup",       lat: 19.1439, lng: 72.9399 },
  { term: "powai",         lat: 19.1197, lng: 72.9069 },
  { term: "chembur",       lat: 19.0622, lng: 72.9012 },
  { term: "mulund",        lat: 19.1763, lng: 72.9561 },
  { term: "thane",         lat: 19.2183, lng: 72.9781 },
  { term: "mankhurd",      lat: 19.0423, lng: 72.9311 },
  { term: "govandi",       lat: 19.0540, lng: 72.9213 },
  // ── Western suburbs ──────────────────────────────────────────
  { term: "andheri",       lat: 19.1136, lng: 72.8697 },
  { term: "bandra",        lat: 19.0596, lng: 72.8295 },
  { term: "borivali",      lat: 19.2307, lng: 72.8567 },
  { term: "malad",         lat: 19.1874, lng: 72.8482 },
  { term: "kandivali",     lat: 19.2053, lng: 72.8496 },
  { term: "goregaon",      lat: 19.1581, lng: 72.8501 },
  { term: "jogeshwari",    lat: 19.1388, lng: 72.8491 },
  { term: "vile parle",    lat: 19.0990, lng: 72.8497 },
  { term: "santacruz",     lat: 19.0831, lng: 72.8440 },
  { term: "versova",       lat: 19.1318, lng: 72.8209 },
  { term: "khar",          lat: 19.0724, lng: 72.8337 },
  // ── South Mumbai ─────────────────────────────────────────────
  { term: "dadar",         lat: 19.0176, lng: 72.8432 },
  { term: "dharavi",       lat: 19.0380, lng: 72.8553 },
  { term: "sion",          lat: 19.0397, lng: 72.8699 },
  { term: "matunga",       lat: 19.0290, lng: 72.8611 },
  { term: "worli",         lat: 19.0168, lng: 72.8167 },
  { term: "lower parel",   lat: 18.9939, lng: 72.8262 },
  { term: "parel",         lat: 19.0009, lng: 72.8420 },
  { term: "colaba",        lat: 18.9067, lng: 72.8147 },
  { term: "fort",          lat: 18.9345, lng: 72.8351 },
  { term: "churchgate",    lat: 18.9354, lng: 72.8272 },
  { term: "csmt",          lat: 18.9399, lng: 72.8355 },
  { term: "cst",           lat: 18.9399, lng: 72.8355 },
  { term: "nariman point", lat: 18.9254, lng: 72.8243 },
  // ── Catch-alls (keep last) ────────────────────────────────────
  { term: "navi mumbai",   lat: 19.0368, lng: 73.0158 },
  { term: "mumbai",        lat: 19.0760, lng: 72.8777 },
];

/**
 * Returns {lat, lng} for a text string using keyword matching.
 * Adds ±~500 m jitter so markers spread out on the map.
 * Falls back to a random point inside the Mumbai bounding box.
 * @param {string} text
 * @returns {{ lat: number, lng: number }}
 */
function geocodeFromText(text) {
  const lower = text.toLowerCase();
  for (const { term, lat, lng } of LOCATION_COORDS) {
    if (lower.includes(term)) {
      return {
        lat: lat + (Math.random() - 0.5) * 0.009,
        lng: lng + (Math.random() - 0.5) * 0.009,
      };
    }
  }
  const { latMin, latMax, lngMin, lngMax } = MUMBAI_BOUNDS;
  return {
    lat: latMin + Math.random() * (latMax - latMin),
    lng: lngMin + Math.random() * (lngMax - lngMin),
  };
}

// ─────────────────────────────────────────────────────────────
// 4.  CATEGORY CLASSIFIER
//     Priority-ordered: first match wins.
// ─────────────────────────────────────────────────────────────
const CATEGORY_RULES = [
  {
    category: "harassment",
    keywords: [
      "eve-teasing", "harassment", "molest", "stalk", "assault", "rape",
      "grope", "molestation", "outrage", "modesty", "sexual offence",
      "abduct", "kidnap", "traffick",
    ],
  },
  {
    category: "broken_lights",
    keywords: [
      "streetlight", "street light", "light out", "no light", "unlit",
      "pothole", "broken road", "footpath", "dark lane", "dark road",
      "power cut", "blackout", "infrastructure",
    ],
  },
  {
    category: "safety_alert",
    keywords: [
      "alert", "warning", "flood", "cyclone", "fire", "bomb", "blast",
      "terror", "protest", "riot", "curfew", "landslide", "gas leak",
      "emergency", "disaster",
    ],
  },
  {
    // Default catch-all for crime news
    category: "unsafe_area",
    keywords: [
      "robbery", "theft", "chain snatching", "mugging", "pickpocket",
      "burglar", "dacoity", "loot", "snatch", "steal", "murder",
      "crime", "arrested", "police", "fir", "accused", "victim", "gang",
    ],
  },
];

/**
 * @param {string} text - combined title + description
 * @returns {string} one of the four Guardian categories
 */
function classifyCategory(text) {
  const lower = text.toLowerCase();
  for (const { category, keywords } of CATEGORY_RULES) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "unsafe_area";
}

// ─────────────────────────────────────────────────────────────
// 5.  SAFETY-RELEVANCE FILTER
//     Only safety/crime/infrastructure articles pass through.
// ─────────────────────────────────────────────────────────────
const SAFETY_KEYWORDS = [
  "crime", "theft", "robbery", "murder", "rape", "assault", "molestation",
  "harassment", "kidnap", "acid", "stalking", "snatching", "fraud",
  "accident", "fire", "flood", "blast", "terror", "alert", "curfew",
  "riot", "dark", "streetlight", "street light", "pothole", "unsafe",
  "police", "arrested", "fir", "victim", "missing", "dead", "body found",
  "dacoity", "chain snatch", "gang", "traffick", "molest", "eve-teas",
  "outrage", "broken light", "unlit", "loot", "burglar", "emergency",
];

function isSafetyRelevant(title, description) {
  const combined = `${title} ${description}`.toLowerCase();
  return SAFETY_KEYWORDS.some((kw) => combined.includes(kw));
}

// ─────────────────────────────────────────────────────────────
// 6.  RSS PARSER
//     Fetches any RSS 2.0 / Atom feed and returns
//     an array of { title, description }.
// ─────────────────────────────────────────────────────────────

/** Strip HTML tags and decode common XML entities. */
function cleanText(raw = "") {
  return raw
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) =>
      m.slice(9, -3)              // unwrap CDATA sections
    )
    .replace(/<[^>]+>/g, "")     // strip any remaining tags
    .replace(/&amp;/g,  "&")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g,    " ")
    .trim();
}

/**
 * @param {string} url  - RSS/Atom feed URL
 * @param {string} name - Label for log output
 * @returns {Promise<Array<{title:string, description:string}>>}
 */
async function parseRSS(url, name) {
  const articles = [];
  try {
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        // Identify as a standard feed reader — rarely blocked
        "User-Agent": "Mozilla/5.0 (compatible; Feedfetcher-Google/1.0)",
        "Accept":     "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    // xmlMode: true tells cheerio to handle self-closing tags correctly
    const $ = cheerio.load(data, { xmlMode: true });

    // Works for both RSS 2.0 (<item>) and Atom (<entry>)
    $("item, entry").each((_, el) => {
      const title = cleanText($(el).find("title").first().text());
      const desc  = cleanText(
        $(el).find("description, summary, content").first().text()
      ).substring(0, 500);

      if (title && title.length > 8) {
        articles.push({ title, description: desc || title });
      }
    });

    console.log(`  [${name}] ✅ ${articles.length} items`);
  } catch (err) {
    console.warn(`  [${name}] ⚠️  ${err.message}`);
  }
  return articles;
}

// ─────────────────────────────────────────────────────────────
// 7.  RSS SOURCE LIST
//     Primary:   Google News RSS — aggregates every Indian outlet,
//                works without an API key, never returns 404.
//     Secondary: Direct outlet feeds for extra local depth.
// ─────────────────────────────────────────────────────────────

// Google News RSS base URL
const GN = "https://news.google.com/rss/search?hl=en-IN&gl=IN&ceid=IN:en&q=";

const RSS_SOURCES = [
  // ── Google News queries (most reliable) ──────────────────────
  {
    name: "GNews › Mumbai Crime",
    url : `${GN}${encodeURIComponent("Mumbai crime")}`,
  },
  {
    name: "GNews › Mumbai Women Safety",
    url : `${GN}${encodeURIComponent("Mumbai women safety harassment")}`,
  },
  {
    name: "GNews › Mumbai Police Alert",
    url : `${GN}${encodeURIComponent("Mumbai police FIR arrested")}`,
  },
  {
    name: "GNews › Ghatkopar / Vidyavihar / Kurla",
    url : `${GN}${encodeURIComponent("Ghatkopar OR Vidyavihar OR Kurla crime")}`,
  },
  {
    name: "GNews › Mumbai Street Safety Infrastructure",
    url : `${GN}${encodeURIComponent("Mumbai streetlight pothole unsafe")}`,
  },

  // ── Direct outlet RSS feeds ───────────────────────────────────
  {
    name: "Mid-Day RSS",
    url : "https://www.mid-day.com/rss/mid-day-feed.xml",
  },
  {
    // Official TOI Mumbai-city RSS feed ID
    name: "Times of India Mumbai RSS",
    url : "https://timesofindia.indiatimes.com/rss/4719161.cms",
  },
  {
    name: "NDTV Latest News RSS",
    url : "https://feeds.feedburner.com/NDTV-LatestNews",
  },
  {
    name: "Free Press Journal RSS",
    url : "https://www.freepressjournal.in/feed",
  },
  {
    name: "Mumbai Live Crime RSS",
    url : "https://www.mumbailive.com/rss/en/crime",
  },
];

// ─────────────────────────────────────────────────────────────
// 8.  DEDUPLICATION — load recent titles from Supabase
// ─────────────────────────────────────────────────────────────
async function fetchExistingTitles() {
  const { data, error } = await supabase
    .from("reports")
    .select("title")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[Supabase] Could not load titles:", error.message);
    return new Set();
  }
  return new Set(data.map((r) => r.title.toLowerCase().trim()));
}

// ─────────────────────────────────────────────────────────────
// 9.  BATCH INSERT
// ─────────────────────────────────────────────────────────────
async function insertReports(reports) {
  if (reports.length === 0) {
    console.log("\n[Supabase] Nothing new to insert.");
    return;
  }
  const { error } = await supabase.from("reports").insert(reports);
  if (error) {
    console.error("\n[Supabase] ❌ Insert error:", error.message);
  } else {
    console.log(`\n[Supabase] ✅ Inserted ${reports.length} new report(s).`);
  }
}

// ─────────────────────────────────────────────────────────────
// 10.  MAIN ORCHESTRATOR
// ─────────────────────────────────────────────────────────────
async function runCrawler() {
  console.log("=".repeat(58));
  console.log("  🕷️  Project Guardian — Crawler v2  (RSS-First)");
  console.log("=".repeat(58));

  // ── Validate environment ──────────────────────────────────────
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error(
      "\n[Config] ❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env"
    );
    process.exit(1);
  }

  // ── Fetch all RSS feeds concurrently ─────────────────────────
  console.log(`\n[Crawler] Fetching ${RSS_SOURCES.length} RSS feeds…\n`);

  const settled = await Promise.allSettled(
    RSS_SOURCES.map(({ url, name }) => parseRSS(url, name))
  );

  const raw = settled.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  console.log(`\n[Crawler] Total raw items         : ${raw.length}`);

  // ── Filter for safety relevance ──────────────────────────────
  const relevant = raw.filter(({ title, description }) =>
    isSafetyRelevant(title, description)
  );
  console.log(`[Crawler] Safety-relevant items   : ${relevant.length}`);

  // ── Load existing titles ──────────────────────────────────────
  console.log("[Supabase] Loading deduplication set…");
  const existingTitles = await fetchExistingTitles();
  console.log(`[Supabase] Existing records        : ${existingTitles.size}`);

  // ── Build insert payload ──────────────────────────────────────
  const seenThisRun = new Set();
  const toInsert    = [];

  for (const { title, description } of relevant) {
    const key = title.toLowerCase().trim();

    if (existingTitles.has(key) || seenThisRun.has(key)) continue;
    seenThisRun.add(key);

    const combined  = `${title} ${description}`;
    const { lat, lng } = geocodeFromText(combined);
    const category  = classifyCategory(combined);

    // Hard-clamp coordinates to the Mumbai bounding box
    const safeLat = Math.max(
      MUMBAI_BOUNDS.latMin,
      Math.min(MUMBAI_BOUNDS.latMax, lat)
    );
    const safeLng = Math.max(
      MUMBAI_BOUNDS.lngMin,
      Math.min(MUMBAI_BOUNDS.lngMax, lng)
    );

    toInsert.push({
      title      : title.substring(0, 255),
      category,
      description: description.substring(0, 500),
      lat        : parseFloat(safeLat.toFixed(6)),
      lng        : parseFloat(safeLng.toFixed(6)),
      upvotes    : 0,
      status     : "active",
    });
  }

  console.log(`[Crawler] New unique reports       : ${toInsert.length}`);

  // ── Insert into Supabase ──────────────────────────────────────
  await insertReports(toInsert);

  console.log("\n" + "=".repeat(58));
  console.log("  ✅  Crawler run complete.");
  console.log("=".repeat(58) + "\n");
}

// ─────────────────────────────────────────────────────────────
// 11.  ENTRY POINT
// ─────────────────────────────────────────────────────────────
runCrawler().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});