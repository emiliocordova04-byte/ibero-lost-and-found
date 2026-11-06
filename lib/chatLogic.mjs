// Rule-based guided assistant for lost and found reports.
// This is NOT an AI model and calls no API: it is a small state machine with
// keyword rules, so every reply can be predicted and tested.
//
// Public API (all pure functions, safe to unit test):
//   startChat(lang)            -> { state, replies }
//   nextTurn(state, userText)  -> { state, replies, save }
//   redact(text)               -> text with private data removed
//   checkGuardrail(text)       -> { reason, pii } | null
//   buildSessionRow(state, { rating, comment, testTag })
//   validateRating(rating, comment)

import { extractItemDescription } from "./extractItem.js";

export const STEPS = ["item", "place", "when"];
const MAX_REASKS = 2;

// ------------------------------------------------------------------ copy ----

const COPY = {
  en: {
    welcome:
      "Hi! I am a rule-based assistant (not AI) that helps you report a lost or found item. I will ask 3 short questions. Question 1 of 3: what did you lose or find? (for example: black Nike backpack, blue keys)",
    q: {
      item: "Question 1 of 3: what did you lose or find? Describe it in a few words (type, color, brand).",
      place: "Question 2 of 3: where did it happen? (for example: the library, second floor)",
      when: "Question 3 of 3: when did it happen? (for example: yesterday afternoon, today at 10)",
    },
    reask: {
      item: "I did not get that. Please describe the item in a few words, for example: black backpack.",
      place: "I did not get the place. Please say where, for example: the library.",
      when: "I did not get the time. Please say when, for example: yesterday.",
    },
    skipped: "No problem, I will write it as not provided.",
    confirmTitle: "Please check your report. This is what staff will read:",
    labels: { item: "Item", category: "Category", color: "Color", place: "Place", when: "When", status: "Status" },
    pending: "Pending staff review",
    priorityNote: "This type of item is marked as priority for staff.",
    confirmAsk: "Is everything correct? Press Yes to send it, or Fix something to change it.",
    yesChip: "Yes, send it",
    fixChip: "Fix something",
    fixAsk: "What should I change? Type item, place or time.",
    fixUnknown: "Please type one of these: item, place or time.",
    saved:
      "Thank you. Your report is saved and is pending staff review. I cannot tell you that your item was found: a staff member checks every report. Was this helpful?",
    afterDone: "Your report is already saved. Type restart to report another item.",
    restarted: "Okay, starting again.",
    help:
      "I can help you report a lost or found item on campus. I ask what, where and when, show you a summary, and a staff member reviews it. Type restart to start over or human to see how to reach a person.",
    human:
      "I am a rule-based assistant, so I cannot replace a person. Please go to the Student Services desk on campus. In this prototype no live agent is connected, but your saved report is what staff will read.",
    continueChip: "Continue my report",
    guardrails: {
      pii:
        "Please do not share phone numbers, emails or ID numbers here. I removed that part. Staff will contact you through Student Services, not through this chat.",
      injection:
        "I cannot change my rules or follow that kind of instruction. I can only help you report a lost or found item.",
      advice:
        "I cannot give medical, legal or homework help. I can only help you report a lost or found item.",
      offtopic:
        "That is outside what I can help with. I only handle lost and found reports on campus. Let us continue with your report.",
      abuse:
        "Let us keep this respectful. I can only help you report a lost or found item.",
      safety:
        "I am sorry you are going through this. I cannot help with that here. If you or someone else is in danger, call 911 now or contact campus security. I am a rule-based assistant and not a counselor.",
    },
  },
  es: {
    welcome:
      "¡Hola! Soy un asistente basado en reglas (no es IA) que te ayuda a reportar un objeto perdido o encontrado. Te haré 3 preguntas cortas. Pregunta 1 de 3: ¿qué perdiste o encontraste? (por ejemplo: mochila negra Nike, llaves azules)",
    q: {
      item: "Pregunta 1 de 3: ¿qué perdiste o encontraste? Descríbelo en pocas palabras (tipo, color, marca).",
      place: "Pregunta 2 de 3: ¿dónde ocurrió? (por ejemplo: la biblioteca, segundo piso)",
      when: "Pregunta 3 de 3: ¿cuándo ocurrió? (por ejemplo: ayer en la tarde, hoy a las 10)",
    },
    reask: {
      item: "No te entendí. Describe el objeto en pocas palabras, por ejemplo: mochila negra.",
      place: "No entendí el lugar. Dime dónde fue, por ejemplo: la biblioteca.",
      when: "No entendí la hora. Dime cuándo fue, por ejemplo: ayer.",
    },
    skipped: "Sin problema, lo escribiré como no indicado.",
    confirmTitle: "Revisa tu reporte. Esto es lo que leerá el personal:",
    labels: { item: "Objeto", category: "Categoría", color: "Color", place: "Lugar", when: "Cuándo", status: "Estado" },
    pending: "Pendiente de revisión del personal",
    priorityNote: "Este tipo de objeto se marca como prioridad para el personal.",
    confirmAsk: "¿Todo está correcto? Presiona Sí para enviarlo o Corregir algo para cambiarlo.",
    yesChip: "Sí, enviarlo",
    fixChip: "Corregir algo",
    fixAsk: "¿Qué debo cambiar? Escribe objeto, lugar u hora.",
    fixUnknown: "Escribe una de estas opciones: objeto, lugar u hora.",
    saved:
      "Gracias. Tu reporte quedó guardado y está pendiente de revisión del personal. No puedo decirte que tu objeto fue encontrado: una persona revisa cada reporte. ¿Te fue útil?",
    afterDone: "Tu reporte ya está guardado. Escribe reiniciar para reportar otro objeto.",
    restarted: "Listo, empezamos de nuevo.",
    help:
      "Te ayudo a reportar un objeto perdido o encontrado en el campus. Pregunto qué, dónde y cuándo, te muestro un resumen y una persona del personal lo revisa. Escribe reiniciar para empezar de nuevo o humano para saber cómo hablar con una persona.",
    human:
      "Soy un asistente basado en reglas, así que no puedo reemplazar a una persona. Ve al módulo de Servicios Estudiantiles en el campus. En este prototipo no hay un agente en vivo, pero tu reporte guardado es lo que leerá el personal.",
    continueChip: "Continuar mi reporte",
    guardrails: {
      pii:
        "Por favor no compartas teléfonos, correos ni números de identificación aquí. Eliminé esa parte. El personal te contactará por Servicios Estudiantiles, no por este chat.",
      injection:
        "No puedo cambiar mis reglas ni seguir ese tipo de instrucción. Solo puedo ayudarte a reportar un objeto perdido o encontrado.",
      advice:
        "No puedo dar ayuda médica, legal ni de tareas. Solo puedo ayudarte a reportar un objeto perdido o encontrado.",
      offtopic:
        "Eso está fuera de lo que puedo hacer. Solo atiendo reportes de objetos perdidos en el campus. Sigamos con tu reporte.",
      abuse:
        "Mantengamos el respeto. Solo puedo ayudarte a reportar un objeto perdido o encontrado.",
      safety:
        "Lamento que estés pasando por esto. No puedo ayudarte con eso aquí. Si tú o alguien más está en peligro, llama al 911 ahora o contacta a seguridad del campus. Soy un asistente basado en reglas y no un consejero.",
    },
  },
};

// ------------------------------------------------------------- redaction ----

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// 7 or more digits, possibly separated by spaces, dots, dashes or parentheses.
const LONG_NUMBER_RE = /(?<![\w/])\+?(?:\d[\s().-]{0,2}){7,}\d(?![\w/])/g;

export function containsPii(text) {
  const t = String(text || "");
  return new RegExp(EMAIL_RE.source, "i").test(t) || new RegExp(LONG_NUMBER_RE.source).test(t);
}

export function redact(text) {
  return String(text || "")
    .replace(EMAIL_RE, "[email removed]")
    .replace(LONG_NUMBER_RE, "[number removed]");
}

// ------------------------------------------------------------- guardrail ----

const RULES = [
  {
    reason: "safety",
    re: /\b(kill myself|suicid\w*|end my life|hurt myself|quiero morir|quitarme la vida|matarme|hacerme dano|hacerme daño)\b/i,
  },
  {
    reason: "injection",
    re: /(ignore (all |any |the |your )?(previous|prior|above)? ?(instructions|rules)|system prompt|developer mode|jailbreak|you are now|act as (a|an|if)|pretend (to be|you are)|ignora (todas )?(las|tus) (instrucciones|reglas)|olvida (tus|las) (instrucciones|reglas)|eres ahora)/i,
  },
  {
    reason: "abuse",
    re: /\b(stupid|idiot|dumb bot|shut up|fuck\w*|bitch|idiota|estupido|estúpido|pendejo|pendeja|cabron|cabrón|puta|mierda)\b/i,
  },
  {
    reason: "advice",
    re: /\b(doctor|diagnos\w+|medicine|medication|pills|symptom\w*|lawyer|sue (him|her|them|someone)|legal advice|homework|essay|write (me )?(an? )?(code|program|poem|story)|abogado|demanda|medicina|medicamento|diagnostico|diagnóstico|tarea de|ensayo)\b/i,
  },
];

const OFFTOPIC_WORDS =
  /\b(weather|clima|joke|chiste|recipe|receta|football|soccer|futbol|fútbol|president|presidente|bitcoin|crypto|stock|movie|pelicula|película|song|cancion|canción|horoscope|horoscopo|horóscopo|capital of|who is|who was|quien es|quién es|what is the meaning|translate|traduce)\b/i;

const LOST_HINT =
  /\b(lost|found|lose|perdi|perdí|perdimos|encontre|encontré|encontramos|left|dejé|deje|olvide|olvidé|missing|backpack|mochila|keys|llaves|phone|celular|wallet|billetera|laptop|bottle|botella|umbrella|paraguas|library|biblioteca|gym|cafeteria|cafetería|classroom|salon|salón|campus)\b/i;

export function checkGuardrail(text, { expectingAnswer = false } = {}) {
  const t = String(text || "");
  for (const rule of RULES) {
    if (rule.re.test(t)) return { reason: rule.reason, pii: containsPii(t) };
  }
  if (OFFTOPIC_WORDS.test(t) && !LOST_HINT.test(t)) {
    return { reason: "offtopic", pii: containsPii(t) };
  }
  // A real question that has nothing to do with a lost item, asked while the
  // assistant is not expecting an answer to its own question.
  if (!expectingAnswer && /\?\s*$/.test(t) && !LOST_HINT.test(t) && !isIntent(t)) {
    return { reason: "offtopic", pii: containsPii(t) };
  }
  if (containsPii(t)) return { reason: "pii", pii: true };
  return null;
}

// ---------------------------------------------------------------- intents ----

const INTENTS = {
  restart: /^(restart|start over|reset|reiniciar|reinicia|empezar de nuevo|empezar otra vez|nuevo reporte)\b/i,
  human: /\b(human|real person|a person|staff|agent|humano|persona real|una persona|personal)\b/i,
  help: /^(help|\?|what can you do|ayuda|ayudame|ayúdame|que puedes hacer|qué puedes hacer)\b/i,
  yes: /^(yes|y|yep|yeah|correct|right|ok|okay|sure|si|sí|claro|correcto|yes, send it|si, enviarlo|sí, enviarlo)\b/i,
  no: /^(no|nope|fix|fix something|change|wrong|corregir|corregir algo|cambiar|incorrecto)\b/i,
  continue: /^(continue|continue my report|continuar|continuar mi reporte)\b/i,
};

function isIntent(text) {
  const t = String(text || "").trim();
  return Object.values(INTENTS).some((re) => re.test(t));
}

function intentOf(text) {
  const t = String(text || "").trim();
  for (const name of ["restart", "continue", "human", "help", "yes", "no"]) {
    if (INTENTS[name].test(t)) return name;
  }
  return null;
}

const SPANISH_HINT =
  /\b(hola|perdi|perdí|mi|mis|mochila|llaves|celular|donde|dónde|cuando|cuándo|ayer|hoy|en la|en el|biblioteca|gracias|por favor|si|sí|que|qué|encontre|encontré)\b/i;

export function detectLang(text, current = "en") {
  if (/[áéíóúñ¿¡]/i.test(text) && SPANISH_HINT.test(text)) return "es";
  if (SPANISH_HINT.test(text) && !/\b(the|my|in|at|and|lost|found)\b/i.test(text)) return "es";
  if (/\b(the|my|in|at|lost|found|yesterday|today)\b/i.test(text)) return "en";
  return current;
}

// ---------------------------------------------------------------- helpers ----

function capitalize(s) {
  const t = String(s || "").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

function usable(text) {
  return /[a-záéíóúñ0-9]{2,}/i.test(String(text || ""));
}

const PRIORITY_CATEGORIES = new Set(["Documents", "Electronics", "Keys"]);
const PRIORITY_WORDS =
  /\b(wallet|billetera|passport|pasaporte|id card|credencial|license|licencia|cartera|keys|llaves|phone|celular|iphone|laptop|computadora)\b/i;

export function isPriority(summary, rawText = "") {
  return PRIORITY_CATEGORIES.has(summary.category) || PRIORITY_WORDS.test(`${summary.item} ${rawText}`);
}

export function buildSummary(answers) {
  const item = answers.item || "";
  const place = answers.place || "";
  const when = answers.when || "";
  const ex = extractItemDescription(`${item} ${place}`);
  const detected = (v) => (v && v !== "Not detected" ? v : "");
  const summary = {
    item: detected(ex.item) || capitalize(item) || "Not provided",
    category: detected(ex.category) || "Other",
    color: detected(ex.color) || "Not provided",
    place: capitalize(place) || "Not provided",
    when: capitalize(when) || "Not provided",
  };
  summary.priority = isPriority(summary, `${item} ${place}`);
  return summary;
}

function bot(text, extra = {}) {
  return { role: "bot", kind: "bot", text, ...extra };
}

function confirmReply(state) {
  const c = COPY[state.lang];
  const s = state.summary;
  const lines = [
    c.confirmTitle,
    `${c.labels.item}: ${s.item}`,
    `${c.labels.category}: ${s.category}`,
    `${c.labels.color}: ${s.color}`,
    `${c.labels.place}: ${s.place}`,
    `${c.labels.when}: ${s.when}`,
    `${c.labels.status}: ${c.pending}`,
  ];
  if (s.priority) lines.push(c.priorityNote);
  lines.push(c.confirmAsk);
  const card = {
    title: c.confirmTitle,
    rows: [
      { label: c.labels.item, value: s.item },
      { label: c.labels.category, value: s.category },
      { label: c.labels.color, value: s.color },
      { label: c.labels.place, value: s.place },
      { label: c.labels.when, value: s.when },
    ],
    status: `${c.labels.status}: ${c.pending}`,
    priorityNote: s.priority ? c.priorityNote : "",
    ask: c.confirmAsk,
  };
  return bot(lines.join("\n"), { kind: "confirm", chips: [c.yesChip, c.fixChip], card });
}

function askStep(state, step) {
  return bot(COPY[state.lang].q[step]);
}

// ------------------------------------------------------------ state machine ----

export function startChat(lang = "en") {
  const state = {
    lang,
    step: "item",
    returnStep: null,
    answers: { item: "", place: "", when: "" },
    reasks: { item: 0, place: 0, when: 0 },
    guardrailHits: 0,
    summary: null,
    saved: false,
  };
  const c = COPY[lang];
  return {
    state,
    replies: [bot(c.welcome, { chips: lang === "es" ? ["Perdí mis llaves", "Hablar con una persona"] : ["Black backpack", "Talk to a human"] })],
  };
}

function guardrailReply(state, reason) {
  const c = COPY[state.lang];
  return { role: "bot", kind: "guardrail", text: c.guardrails[reason], reason };
}

export function nextTurn(prev, rawText) {
  const state = { ...prev, answers: { ...prev.answers }, reasks: { ...prev.reasks } };
  const text = String(rawText || "").trim();
  const replies = [];
  let save = null;

  state.lang = detectLang(text, state.lang);
  const c = COPY[state.lang];
  const intent = intentOf(text);

  // 1. restart works from anywhere
  if (intent === "restart") {
    const fresh = startChat(state.lang);
    fresh.state.guardrailHits = state.guardrailHits;
    return { state: fresh.state, replies: [bot(c.restarted), askStep(fresh.state, "item")], save: null };
  }

  const expecting = STEPS.includes(state.step) || state.step === "fix_choose";

  // 2. guardrails (never skipped, also after the report is saved)
  const guard = checkGuardrail(text, { expectingAnswer: expecting });
  let cleaned = text;
  if (guard) {
    state.guardrailHits += 1;
    replies.push(guardrailReply(state, guard.reason));
    if (guard.reason !== "pii") {
      // blocked: stay on the same step, repeat the question when there is one
      if (STEPS.includes(state.step)) replies.push(askStep(state, state.step));
      if (state.step === "confirm") replies.push(confirmReply(state));
      return { state, replies, save: null };
    }
    cleaned = redact(text);
    if (!usable(cleaned.replace(/\[(email|number) removed\]/g, ""))) {
      if (STEPS.includes(state.step)) replies.push(askStep(state, state.step));
      return { state, replies, save: null };
    }
  }

  // 3. intents
  if (intent === "help") {
    replies.push(bot(c.help));
    if (STEPS.includes(state.step)) replies.push(askStep(state, state.step));
    return { state, replies, save: null };
  }
  if (intent === "human") {
    replies.push(bot(c.human, { kind: "handoff", chips: state.step === "done" ? [] : [c.continueChip] }));
    return { state, replies, save: null };
  }
  if (intent === "continue" && STEPS.includes(state.step)) {
    replies.push(askStep(state, state.step));
    return { state, replies, save: null };
  }

  // 4. after the report is saved
  if (state.step === "done") {
    replies.push(bot(c.afterDone));
    return { state, replies, save: null };
  }

  // 5. confirm step: the human checkpoint
  if (state.step === "confirm") {
    if (intent === "yes") {
      state.step = "done";
      state.saved = true;
      save = { summary: state.summary };
      replies.push(bot(c.saved, { kind: "saved" }));
      return { state, replies, save };
    }
    if (intent === "no") {
      state.step = "fix_choose";
      replies.push(bot(c.fixAsk, { chips: [c.labels.item, c.labels.place, c.labels.when] }));
      return { state, replies, save: null };
    }
    replies.push(confirmReply(state));
    return { state, replies, save: null };
  }

  // 6. which field to fix
  if (state.step === "fix_choose") {
    const t = cleaned.toLowerCase();
    let field = null;
    if (/\b(item|object|objeto|thing|cosa)\b/.test(t)) field = "item";
    else if (/\b(place|where|lugar|donde|dónde)\b/.test(t)) field = "place";
    else if (/\b(time|when|hora|cuando|cuándo|fecha|date)\b/.test(t)) field = "when";
    if (!field) {
      replies.push(bot(c.fixUnknown));
      return { state, replies, save: null };
    }
    state.step = field;
    state.returnStep = "confirm";
    state.reasks[field] = 0;
    replies.push(askStep(state, field));
    return { state, replies, save: null };
  }

  // 7. intake questions
  if (STEPS.includes(state.step)) {
    const step = state.step;
    if (!usable(cleaned)) {
      state.reasks[step] += 1;
      if (state.reasks[step] > MAX_REASKS) {
        state.answers[step] = "";
        replies.push(bot(c.skipped));
      } else {
        replies.push(bot(c.reask[step]));
        return { state, replies, save: null };
      }
    } else {
      state.answers[step] = cleaned;
    }
    const idx = STEPS.indexOf(step);
    if (state.returnStep === "confirm" || idx === STEPS.length - 1) {
      state.summary = buildSummary(state.answers);
      state.step = "confirm";
      state.returnStep = null;
      replies.push(confirmReply(state));
    } else {
      state.step = STEPS[idx + 1];
      replies.push(askStep(state, state.step));
    }
    return { state, replies, save: null };
  }

  replies.push(bot(c.help));
  return { state, replies, save: null };
}

// -------------------------------------------------------------- storage ----

export function validateRating(rating, comment = "") {
  if (rating !== "up" && rating !== "down") return { ok: false, error: "rating must be up or down" };
  const clean = redact(String(comment || "")).trim().slice(0, 300);
  return { ok: true, rating, comment: clean };
}

export function buildSessionRow(state, { testTag = null, transcript = [] } = {}) {
  const s = state.summary || buildSummary(state.answers);
  return {
    lang: state.lang,
    item: s.item,
    category: s.category,
    color: s.color,
    place: s.place,
    when_text: s.when,
    status: "pending_staff_review",
    priority: Boolean(s.priority),
    guardrail_hits: state.guardrailHits || 0,
    test_tag: testTag ? String(testTag).slice(0, 20) : null,
    transcript: transcript.map((m) => ({ role: m.role, text: redact(m.text) })),
  };
}
