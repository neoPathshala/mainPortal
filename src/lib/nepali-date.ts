import NepaliDateImport from "nepali-date-converter";

// The package publishes CJS and ESM builds. Support both Next.js and native
// Node test imports without relying on the machine's local timezone.
const NepaliDate = typeof NepaliDateImport === "function" ? NepaliDateImport
  : (NepaliDateImport as unknown as { default: typeof NepaliDateImport }).default;
export const NEPAL_TIME_ZONE = "Asia/Kathmandu";
export const BS_MONTHS = ["Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
type DateValue = string | Date | number | null | undefined;
type Calendar = "ad" | "bs" | "notice";
const civilDate = new Intl.DateTimeFormat("en-CA", { timeZone: NEPAL_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const clock = new Intl.DateTimeFormat("en-GB", { timeZone: NEPAL_TIME_ZONE, hour: "numeric", minute: "2-digit", hour12: true });
const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/;

function instant(value: DateValue) {
  if (value === null || value === undefined || value === "") return null;
  // A wall-clock value without an offset is a Nepal time, never device time.
  const normalized = typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value) ? `${value}+05:45` : value;
  const date = normalized instanceof Date ? normalized : new Date(normalized);
  return Number.isFinite(date.getTime()) ? date : null;
}
function parts(value: DateValue, calendar: Calendar) {
  const match = typeof value === "string" ? dateOnly.exec(value) : null;
  try {
    if (calendar === "bs" || (calendar === "notice" && match && Number(match[1]) >= 2070)) {
      if (!match) return null;
      const [year, month, day] = match.slice(1).map(Number);
      const bs = new NepaliDate(year, month - 1, day).getBS();
      return bs.year === year && bs.month === month - 1 && bs.date === day ? { year, month, day } : null;
    }
    const date = instant(value);
    if (!date) return null;
    const fields = match ? null : Object.fromEntries(civilDate.formatToParts(date).map(part => [part.type, part.value]));
    const [year, month, day] = match ? match.slice(1).map(Number) : [Number(fields!.year), Number(fields!.month), Number(fields!.day)];
    // Give the library Nepal's civil date; its AD conversion uses local getters.
    const local = new Date(year, month - 1, day, 12);
    if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day) return null;
    const converted = new NepaliDate(local);
    const ad = converted.getAD();
    // Some package versions reflect dates before their supported range.
    if (ad.year !== year || ad.month !== month - 1 || ad.date !== day) return null;
    const bs = converted.getBS();
    return { year: bs.year, month: bs.month + 1, day: bs.date };
  } catch { return null; }
}
export function bsDateParts(value: DateValue, calendar: Calendar = "ad") {
  const date = parts(value, calendar);
  if (!date) return { year: null, day: "—", month: "BS", label: "Date unavailable", sortKey: 0 };
  return { year: date.year, day: String(date.day).padStart(2, "0"), month: BS_MONTHS[date.month - 1], label: `${date.day} ${BS_MONTHS[date.month - 1]} ${date.year} BS`, sortKey: date.year * 10000 + date.month * 100 + date.day };
}
export function formatBSDate(value: DateValue, calendar: Calendar = "ad") {
  return bsDateParts(value, calendar).label;
}
export function formatNepalTime(value: DateValue) {
  const date = instant(value);
  return date ? clock.format(date) : "";
}
export function formatBSDateTime(value: DateValue, calendar: Calendar = "ad") {
  const date = formatBSDate(value, calendar);
  if (date === "Date unavailable" || (typeof value === "string" && dateOnly.test(value))) return date;
  const time = formatNepalTime(value);
  return time ? `${date} · ${time} NPT` : date;
}
export function nepaliYear(value: DateValue = new Date()) {
  return String(bsDateParts(value).year ?? "—");
}

// A BS civil date and 24-hour Nepal clock, independent of the host timezone.
export function parseBSDateTime(value: string): Date | null {
 const match=/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(value.trim());if(!match)return null;
 const [year,month,day]=match.slice(1,4).map(Number);const hour=Number(match[4]||0),minute=Number(match[5]||0);
 if(hour>23||minute>59)return null;
 try{const date=new NepaliDate(year,month-1,day);const bs=date.getBS();if(bs.year!==year||bs.month!==month-1||bs.date!==day)return null;const ad=date.getAD();return new Date(Date.UTC(ad.year,ad.month,ad.date,hour,minute)-345*60000);}catch{return null;}
}

export function formatBSInput(value: DateValue): string {
 const date=instant(value);const civil=parts(value,"ad");if(!date||!civil)return "";
 const time=new Intl.DateTimeFormat("en-GB",{timeZone:NEPAL_TIME_ZONE,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(date);
 return `${civil.year}-${String(civil.month).padStart(2,"0")}-${String(civil.day).padStart(2,"0")} ${time}`;
}
