const MONTHS: Record<string, number> = {
  JAN: 0, FEV: 1, MAR: 2, ABR: 3, MAI: 4, JUN: 5,
  JUL: 6, AGO: 7, SET: 8, OUT: 9, NOV: 10, DEZ: 11,
};

export type ParsedMessage = {
  date: Date;
  direction: "out" | "in";
  content: string;
};

export type ParseResult = {
  name?: string;
  role?: string;
  linkedinUrl?: string;
  messages: ParsedMessage[];
  suggested: {
    status: string;
    temperature: string;
    nextAction: string;
  };
};

const IGNORE_PATTERNS = [
  /^O status está disponível/i,
  /^Conexão de \d+º? grau/i,
  /^Ver perfil/i,
  /^\*+$/,
  /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u,
];

function shouldIgnore(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  return IGNORE_PATTERNS.some((rx) => rx.test(t));
}

function parseDate(line: string, year: number): Date | null {
  // e.g. "16 DE ABR." or "3 DE MAI."
  const m = line.match(/^(\d{1,2})\s+DE\s+([A-ZÇ]{3,})\.?$/i);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const mon = MONTHS[m[2].toUpperCase().slice(0, 3)];
  if (mon == null) return null;
  return new Date(year, mon, day);
}

export function parseLinkedInConversation(raw: string): ParseResult {
  const lines = raw.split(/\r?\n/);
  const result: ParseResult = {
    messages: [],
    suggested: { status: "em-conversa", temperature: "morno", nextAction: "Próximo follow-up" },
  };

  // Try header: [Name](https://www.linkedin.com/in/...)
  for (const ln of lines.slice(0, 20)) {
    const m = ln.match(/\[([^\]]+)\]\((https?:\/\/[^)]*linkedin\.com\/in\/[^)]+)\)/i);
    if (m) {
      result.name = m[1].trim();
      result.linkedinUrl = m[2].trim();
      break;
    }
  }
  // Cargo on a line right after the name link
  if (result.name) {
    const idx = lines.findIndex((l) => l.includes(`[${result.name}]`));
    if (idx >= 0) {
      for (let i = idx + 1; i < Math.min(idx + 4, lines.length); i++) {
        const t = lines[i].trim();
        if (t && !shouldIgnore(t) && !parseDate(t, 2025) && !/^Miguel Borges/i.test(t)) {
          result.role = t;
          break;
        }
      }
    }
  }

  const now = new Date();
  let currentDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let currentDirection: "out" | "in" | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentDirection && buffer.length) {
      const content = buffer.join("\n").trim();
      if (content) result.messages.push({ date: currentDate, direction: currentDirection, content });
    }
    buffer = [];
  };

  for (const rawLn of lines) {
    const ln = rawLn.trimEnd();
    if (shouldIgnore(ln)) continue;
    const d = parseDate(ln.trim(), now.getFullYear());
    if (d) {
      flush();
      currentDate = d;
      continue;
    }
    // Mine: "Miguel Borges enviou as seguintes mensagens às HH:MM"
    const mineMatch = ln.match(/^Miguel Borges\s+enviou\s+.+?(\d{1,2}:\d{2})/i);
    if (mineMatch) {
      flush();
      currentDirection = "out";
      const [h, mn] = mineMatch[1].split(":").map(Number);
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), h, mn);
      continue;
    }
    // Theirs: "[Name] HH:MM"
    if (result.name) {
      const escaped = result.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const theirRx = new RegExp(`^${escaped}\\s+(\\d{1,2}:\\d{2})`, "i");
      const tm = ln.match(theirRx);
      if (tm) {
        flush();
        currentDirection = "in";
        const [h, mn] = tm[1].split(":").map(Number);
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), h, mn);
        continue;
      }
    }
    // Skip lines that are just the linkedin header line
    if (/\[.+\]\(https?:\/\/[^)]*linkedin\.com/.test(ln)) continue;
    if (currentDirection) buffer.push(ln);
  }
  flush();

  // Suggest status/temperature
  const last = result.messages[result.messages.length - 1];
  if (last) {
    const txt = last.content.toLowerCase();
    if (last.direction === "in") result.suggested.temperature = "quente";
    if (/reuni|agendar|call|meet/i.test(txt)) result.suggested.status = "reuniao-marcada";
    else if (/proposta|orçamento/i.test(txt)) result.suggested.status = "proposta-enviada";
  }
  return result;
}
