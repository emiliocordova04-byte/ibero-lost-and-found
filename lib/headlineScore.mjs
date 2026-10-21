// Rule-based headline checker for the Headline Lab. This is NOT AI and does
// not predict real performance: it checks a headline against a few plain
// writing rules the brand voice asks for. The live A/B tests are what measure
// performance.

const HYPE = [
  "revolutionary", "game-changing", "game changing", "magic", "magical",
  "ai-powered", "ultimate", "best-in-class", "world-class", "cutting-edge",
  "next-generation", "disruptive", "supercharge",
];
const AUDIENCE = ["campus", "campuses", "university", "universities", "student", "students", "school"];
const OUTCOME = ["item", "items", "return", "returned", "back", "find", "found", "owner", "owners", "record", "faster", "lost"];

export function wordCount(text) {
  return (String(text || "").trim().match(/\S+/g) || []).length;
}

function hasAny(text, list) {
  const t = String(text || "").toLowerCase();
  return list.some((w) => new RegExp(`\\b${w.replace(/[-]/g, "\\-")}\\b`, "i").test(t));
}

export function scoreHeadline(text) {
  const t = String(text || "").trim();
  const words = wordCount(t);
  const checks = [
    {
      key: "length_words",
      label: "5 to 12 words",
      points: 25,
      pass: words >= 5 && words <= 12,
      tip: "Short enough to read in one glance, long enough to say something.",
    },
    {
      key: "length_chars",
      label: "70 characters or fewer",
      points: 10,
      pass: t.length > 0 && t.length <= 70,
      tip: "Long headlines wrap awkwardly on phones.",
    },
    {
      key: "audience",
      label: "Names the audience or place",
      points: 20,
      pass: hasAny(t, AUDIENCE),
      tip: "Say campus, university or students so the right reader recognizes it.",
    },
    {
      key: "outcome",
      label: "Names the outcome",
      points: 15,
      pass: hasAny(t, OUTCOME),
      tip: "Lead with what happens: items returned, found, recorded.",
    },
    {
      key: "no_hype",
      label: "No hype words",
      points: 20,
      pass: t.length > 0 && !hasAny(t, HYPE),
      tip: "Brand voice is professional and specific, not promotional.",
    },
    {
      key: "no_exclaim",
      label: "No exclamation marks",
      points: 10,
      pass: t.length > 0 && !t.includes("!"),
      tip: "Calm confidence reads as more trustworthy to administrators.",
    },
  ];
  const score = checks.reduce((s, c) => s + (c.pass ? c.points : 0), 0);
  return { score, words, chars: t.length, checks };
}
