// Simulated / rule-based item description extractor.
// This is intentionally NOT a real NLP model and does NOT call any AI API.
// It uses simple keyword matching and heuristics in plain JavaScript.

// Colors — English + Spanish. `label` is what we show back to the user.
const COLORS = [
  { label: "Black", keywords: ["black", "negro", "negra"] },
  { label: "White", keywords: ["white", "blanco", "blanca"] },
  { label: "Blue", keywords: ["blue", "azul"] },
  { label: "Red", keywords: ["red", "rojo", "roja"] },
  { label: "Green", keywords: ["green", "verde"] },
  { label: "Yellow", keywords: ["yellow", "amarillo", "amarilla"] },
  { label: "Orange", keywords: ["orange", "naranja"] },
  { label: "Purple", keywords: ["purple", "morado", "morada", "violeta"] },
  { label: "Pink", keywords: ["pink", "rosa", "rosado"] },
  { label: "Brown", keywords: ["brown", "cafe", "café", "marron", "marrón"] },
  { label: "Gray", keywords: ["gray", "grey", "gris"] },
  { label: "Silver", keywords: ["silver", "plateado", "plata"] },
  { label: "Gold", keywords: ["gold", "dorado", "dorada", "oro"] },
];

// Categories — broad groups, each with a canonical `label` and trigger
// keywords (EN + ES). Ordered most-specific first so e.g. "cartera" is read
// as a Bag before the Accessories catch-all.
const CATEGORIES = [
  {
    label: "Keys",
    keywords: ["keys", "key", "llaves", "llave"],
  },
  {
    label: "Electronics",
    keywords: [
      "celular", "telefono", "teléfono", "smartphone", "iphone", "android",
      "laptop", "computadora", "computador", "portatil", "portátil", "notebook",
      "audifonos", "audífonos", "auriculares", "earphones", "earbuds",
      "cargador", "charger", "tablet", "tableta", "ipad",
      "phone", "headphones",
    ],
  },
  {
    label: "Bag",
    keywords: [
      "mochila", "bolsa", "bolso", "cartera", "maleta", "portafolio",
      "backpack", "bag", "purse", "suitcase", "handbag", "briefcase",
    ],
  },
  {
    label: "Clothing",
    keywords: [
      "camisa", "playera", "blusa", "sudadera", "chamarra", "chaqueta",
      "pantalon", "pantalón", "falda", "gorra", "sueter", "suéter", "chaleco",
      "abrigo", "bufanda", "guantes",
      "shirt", "tshirt", "t-shirt", "jacket", "hoodie", "pants", "sweater",
      "cap", "hat", "coat", "scarf", "gloves", "vest",
    ],
  },
  {
    label: "Accessories",
    keywords: [
      "lentes", "gafas", "anteojos", "reloj", "billetera",
      "paraguas", "sombrilla", "umbrella",
      "glasses", "sunglasses", "watch", "wallet",
    ],
  },
  {
    label: "Documents",
    keywords: [
      "credencial", "identificacion", "identificación", "cuaderno", "libreta",
      "libro", "carpeta", "folder",
      "id", "notebook", "book",
    ],
  },
  {
    label: "Water bottle",
    keywords: ["water bottle", "bottle", "termo", "botella"],
  },
];

// Campus locations — canonical `label` + trigger keywords (EN + ES).
const LOCATIONS = [
  { label: "Cafeteria", keywords: ["cafeteria", "cafetería", "cafe", "comedor"] },
  { label: "Library", keywords: ["library", "biblioteca"] },
  { label: "Gym", keywords: ["gym", "gimnasio"] },
  { label: "Parking lot", keywords: ["parking lot", "parking", "estacionamiento"] },
  { label: "Classroom", keywords: ["classroom", "salon", "salón", "aula"] },
  { label: "Entrance", keywords: ["entrance", "entrada", "lobby", "recepcion", "recepción"] },
  { label: "Auditorium", keywords: ["auditorium", "auditorio"] },
  { label: "Cancha / sports field", keywords: ["field", "court", "cancha"] },
  { label: "Bathroom", keywords: ["bathroom", "restroom", "baño", "bano", "sanitario"] },
  { label: "Hallway", keywords: ["hallway", "corridor", "pasillo"] },
];

// Words that can precede a noun and shouldn't be treated as the item itself.
const STOPWORDS = new Set([
  "the", "a", "an", "my", "your", "his", "her", "their", "some", "this", "that",
  "el", "la", "los", "las", "un", "una", "unos", "unas", "mi", "mis", "su", "sus",
  "de", "del", "of",
]);

function normalize(text) {
  return (text || "").toLowerCase();
}

function findByKeywords(text, table) {
  const lower = normalize(text);
  for (const entry of table) {
    for (const kw of entry.keywords) {
      // word-ish boundary match so "car" doesn't match inside "cartera"
      const re = new RegExp(`(^|[^a-záéíóúñü])${escapeRegExp(kw)}([^a-záéíóúñü]|$)`, "i");
      if (re.test(lower)) return entry.label;
    }
  }
  return null;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectColor(text) {
  return findByKeywords(text, COLORS);
}

function detectCategory(text) {
  const match = findByKeywords(text, CATEGORIES);
  if (match) return match;
  // Nothing matched — the extractor's own labels are always English.
  return "Other";
}

// Prepositions that introduce a place name. INSIDE means the object is at/in
// that place (we return just the place); NEAR means it's only nearby (we keep
// the relation word, echoing the user's phrasing).
const INSIDE_PREPS = ["dentro de", "adentro de", "adentro", "inside", "en", "in", "at"];
const NEAR_PREPS = [
  "cerca de", "a un lado de", "al lado de", "enfrente de", "frente a", "junto a",
  "in front of", "infront of", "infront", "next to", "nextto", "near", "beside", "by",
];

// The extractor's own relation word is always English, regardless of the
// preposition the user typed ("cerca de Capeltic" -> "Near Capeltic").
const NEAR_RELATION = {
  "cerca de": "Near",
  "a un lado de": "Beside",
  "al lado de": "Beside",
  "enfrente de": "In front of",
  "frente a": "In front of",
  "junto a": "Next to",
  "in front of": "In front of",
  "infront of": "In front of",
  "infront": "In front of",
  "next to": "Next to",
  "nextto": "Next to",
  "near": "Near",
  "beside": "Beside",
  "by": "Near",
};

// Leading Spanish articles are dropped from a captured place name so the
// output reads cleanly ("cerca de la cafetería" -> "Near cafetería"); the
// English article "the" is kept ("near the library" -> "Near the library").
const SPANISH_ARTICLES = new Set(["el", "la", "los", "las", "un", "una", "unos", "unas"]);

function stripLeadingSpanishArticle(place) {
  const parts = place.split(/\s+/);
  if (parts.length > 1 && SPANISH_ARTICLES.has(parts[0].toLowerCase())) {
    return parts.slice(1).join(" ");
  }
  return place;
}

// Combined, longest phrase first so "in front of" wins over "in", etc.
const LOCATION_PREPS = [
  ...NEAR_PREPS.map((phrase) => ({ phrase, type: "near" })),
  ...INSIDE_PREPS.map((phrase) => ({ phrase, type: "inside" })),
].sort((a, b) => b.phrase.length - a.phrase.length);

// Grab the noun phrase after a preposition: a few words, stopping at
// punctuation or a conjunction ("y" / "and" / "o" / "or").
function takePlacePhrase(rest) {
  const words = rest.trim().split(/\s+/);
  const collected = [];
  for (let w of words) {
    const punctIdx = w.search(/[.,;:!?()"'¡¿]/);
    let stop = false;
    if (punctIdx === 0) break;
    if (punctIdx > 0) {
      w = w.slice(0, punctIdx);
      stop = true;
    }
    if (["y", "and", "o", "or", "pero", "but"].includes(w.toLowerCase())) break;
    if (w) collected.push(w);
    if (stop || collected.length >= 4) break;
  }
  return stripLeadingSpanishArticle(trimTrailingConnectors(collected.join(" ")).trim());
}

// Capitalize a captured place, but leave a leading article ("the library")
// alone — only bare names like "capeltic" become "Capeltic".
function capitalizePlace(place) {
  const first = place.split(/\s+/)[0].toLowerCase();
  return STOPWORDS.has(first) ? place : capitalize(place);
}

function detectPrepositionLocation(text) {
  for (const { phrase, type } of LOCATION_PREPS) {
    const re = new RegExp(
      `(?:^|[^\\p{L}])(${escapeRegExp(phrase)})\\s+(.+)$`,
      "iu"
    );
    const m = text.match(re);
    if (!m) continue;
    const place = takePlacePhrase(m[2]);
    if (!place) continue;
    if (type === "inside") return capitalize(place);
    const relation = NEAR_RELATION[phrase] || capitalize(m[1].toLowerCase());
    return `${relation} ${capitalizePlace(place)}`;
  }
  return null;
}

function detectLocation(text) {
  const source = (text || "").trim();
  const lower = normalize(source);

  // 1. Special case (highest priority): classroom / salón + room number.
  const room = lower.match(/\b(classroom|salón|salon|aula)\s*#?\s*(\d{1,4}[a-z]?)\b/i);
  if (room) {
    return `${capitalize(room[1])} ${room[2].toUpperCase()}`;
  }

  // 2. Preposition-driven capture — works for place names we don't know.
  const prep = detectPrepositionLocation(source);
  if (prep) return prep;

  // 3. Fall back to the known campus keyword list.
  return findByKeywords(source, LOCATIONS);
}

function detectDate(text) {
  const lower = normalize(text);

  if (/\b(today|hoy|esta mañana|esta manana|this morning|tonight|esta noche|esta tarde)\b/.test(lower)) {
    return "Today";
  }
  if (/\b(yesterday|ayer|anoche|last night)\b/.test(lower)) {
    return "Yesterday";
  }
  if (/\b(tomorrow|mañana|manana)\b/.test(lower)) {
    return "Tomorrow";
  }

  // Numeric date patterns: 12/03/2026, 12-03-2026, 2026-03-12
  const numeric = lower.match(/\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
  if (numeric) return numeric[1];

  // "March 12", "12 de marzo", "12 marzo"
  const months =
    "(january|february|march|april|may|june|july|august|september|october|november|december|" +
    "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)";
  const monthDay = lower.match(new RegExp(`\\b${months}\\s+\\d{1,2}\\b`, "i"));
  if (monthDay) return capitalize(monthDay[0]);
  const dayMonth = lower.match(new RegExp(`\\b\\d{1,2}\\s+(?:de\\s+)?${months}\\b`, "i"));
  if (dayMonth) return dayMonth[0];

  return null;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Connector / preposition words (EN + ES) that shouldn't dangle at the end of
// the extracted item phrase, e.g. "Camisa azul en" -> "Camisa azul".
const TRAILING_CONNECTORS = new Set([
  "en", "in", "cerca", "near", "at", "on", "by", "de", "del",
  "para", "con", "junto", "a", "of", "the", "el", "la",
]);

function trimTrailingConnectors(phrase) {
  const parts = phrase.split(/\s+/);
  while (parts.length && TRAILING_CONNECTORS.has(parts[parts.length - 1].toLowerCase())) {
    parts.pop();
  }
  return parts.join(" ");
}

// Full timestamp of when the report is being submitted, e.g.
// "Sep 1, 2026, 2:32 PM". Used only when the text mentions no explicit date,
// since the exact time matters for how recoverable a lost item still is.
function nowTimestamp() {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Find the literal category keyword the user actually typed (e.g. "glasses"),
// so the item field can use their word rather than the generic label.
function categoryWordInText(lowerText) {
  for (const entry of CATEGORIES) {
    for (const kw of entry.keywords) {
      const re = new RegExp(
        `(^|[^a-záéíóúñü])(${escapeRegExp(kw)})([^a-záéíóúñü]|$)`,
        "i"
      );
      const m = lowerText.match(re);
      if (m) return { word: m[2], index: m.index + m[1].length };
    }
  }
  return null;
}

// Try to pull the noun phrase describing the object.
// Heuristic: look for "found/lost/left <the> <adjective?> <noun>" patterns;
// then the real noun the user typed; only then the category label.
function detectItem(text, category, color) {
  const lower = normalize(text);

  const triggers = [
    "encontre", "encontré", "encontramos", "hallé", "halle",
    "perdi", "perdí", "perdimos", "found", "lost", "left", "dejé", "deje", "olvidé", "olvide",
  ];

  for (const trigger of triggers) {
    const idx = lower.indexOf(trigger);
    if (idx === -1) continue;
    const after = lower.slice(idx + trigger.length).trim();
    // grab up to the next 4 words, stopping at prepositions that start a location clause
    const words = after.split(/\s+/).slice(0, 5);
    const collected = [];
    for (const w of words) {
      const clean = w.replace(/[.,;:!?"'()]/g, "");
      if (!clean) continue;
      if (["near", "cerca", "in", "at", "on", "by", "junto", "afuera", "dentro"].includes(clean)) break;
      if (STOPWORDS.has(clean)) continue;
      collected.push(clean);
      if (collected.length >= 3) break;
    }
    if (collected.length) {
      const phrase = trimTrailingConnectors(collected.join(" "));
      if (phrase) return capitalize(phrase);
    }
  }

  // No trigger phrase — prefer the real noun the user wrote, with an
  // adjective/color immediately before it ("blue glasses").
  const lowerAll = normalize(text);
  const hit = categoryWordInText(lowerAll);
  if (hit) {
    const prev = (lowerAll.slice(0, hit.index).trim().split(/\s+/).pop() || "")
      .replace(/[.,;:!?"'()¡¿]/g, "");
    const usePrev = prev && !STOPWORDS.has(prev) && !TRAILING_CONNECTORS.has(prev);
    return capitalize(((usePrev ? prev + " " : "") + hit.word).trim());
  }

  // Absolute last resort: the category label — but not the generic
  // "Other" bucket, which says nothing about the object.
  if (category && category !== "Other") {
    return color ? `${color} ${category.toLowerCase()}` : category;
  }
  return null;
}

export function extractItemDescription(text) {
  const clean = (text || "").trim();
  if (!clean) {
    return {
      item: "Not detected",
      category: "Not detected",
      color: "Not detected",
      location: "Not detected",
      date: "Not detected",
    };
  }

  const color = detectColor(clean);
  const category = detectCategory(clean);
  const location = detectLocation(clean);
  // If no date is mentioned in the text, default to today (submission date).
  // Explicit date in the text -> keep just that date (time unknown).
  // Nothing mentioned -> stamp the full submission date + time.
  const date = detectDate(clean) || nowTimestamp();
  const item = detectItem(clean, category, color);

  const fallback = (v) => (v && String(v).trim() ? v : "Not detected");

  return {
    item: fallback(item),
    category: fallback(category),
    color: fallback(color),
    location: fallback(location),
    date: fallback(date),
  };
}

export default extractItemDescription;
