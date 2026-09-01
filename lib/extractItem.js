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

// Rough language guess so fallbacks ("Other" vs "Otro") match the input.
function isSpanish(text) {
  const lower = normalize(text);
  if (/[ñáéíóú¿¡]/.test(lower)) return true;
  return /(^|[^a-z])(el|la|los|las|un|una|unos|unas|mi|mis|de|del|cerca|encontr|perd|dej|olvid|esta|hoy|ayer|ma[nñ]ana)([^a-z]|$)/.test(
    lower
  );
}

function detectCategory(text) {
  const match = findByKeywords(text, CATEGORIES);
  if (match) return match;
  // Nothing matched — keep the field useful rather than empty.
  return isSpanish(text) ? "Otro" : "Other";
}

function detectLocation(text) {
  const label = findByKeywords(text, LOCATIONS);

  // Classroom / salón is often followed by a room number ("salon 212",
  // "classroom 212"). Keep the number and echo the word the user actually
  // typed, capitalized ("Salón 212", "Classroom 212").
  if (label === "Classroom") {
    const lower = normalize(text);
    const match = lower.match(/\b(classroom|salón|salon|aula)\s*#?\s*(\d{1,4}[a-z]?)\b/i);
    if (match) {
      return `${capitalize(match[1])} ${match[2].toUpperCase()}`;
    }
  }

  return label;
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

// Today's date, as the report is being submitted, in YYYY-MM-DD form.
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Try to pull the noun phrase describing the object.
// Heuristic: look for "found/lost/left <the> <adjective?> <noun>" patterns,
// otherwise fall back to the detected category.
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

  // Fall back to "<color> <category>" or just the category — but not for the
  // generic "Other"/"Otro" bucket, which says nothing about the object.
  if (category && category !== "Other" && category !== "Otro") {
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
  const date = detectDate(clean) || todayISO();
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
