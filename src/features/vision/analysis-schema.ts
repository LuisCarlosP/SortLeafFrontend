/** Visual observations are approximate. Sorting routes apply to objects, not materials alone. */
export type MaterialFamily = "plastic" | "glass" | "metal" | "paper" | "cardboard" | "composite" | "organic" | "unknown";
export type SortingRoute = "likely_recyclable" | "special_collection" | "not_recyclable" | "check_locally" | "unknown";
export type ScanOutcome = "identified" | "not_recyclable" | "out_of_scope" | "uncertain";

interface ObjectRule {
  names: RegExp;
  es: string;
  material?: MaterialFamily;
  accepted?: MaterialFamily[];
  route?: SortingRoute;
}

// Ordinary collection examples follow Curridabat's Reglamento para la Gestión Integral de Residuos.
// Acceptance varies by collection program and condition. No resin, purity or brand is inferred.
const objects = {
  bottle: { names: /\bbottles?\b/g, es: "Botella", accepted: ["plastic", "glass", "metal"] },
  jar: { names: /\bjars?\b/g, es: "Frasco", accepted: ["glass", "plastic"] },
  can: { names: /\b(?:cans|(?:tin|soda|drink|beverage|food|alumin[i]?um|metal|steel) can|(?:a|the|one) can)\b/g, es: "Lata", material: "metal", accepted: ["metal"] },
  box: { names: /\b(?:boxes|box)\b/g, es: "Caja", accepted: ["cardboard", "paper"] },
  cardboard: { names: /\b(?:sheets? of cardboard|corrugated cardboard|cardboard sheets?)\b/g, es: "Lámina de cartón", material: "cardboard", accepted: ["cardboard"] },
  newspaper: { names: /\b(?:newspapers?|magazines?|sheets? of paper|paper sheets?|office paper)\b/g, es: "Papel impreso o en hojas", material: "paper", accepted: ["paper"] },
  carton: { names: /\b(?:milk |juice |beverage )?cartons?\b/g, es: "Cartón de envase", route: "check_locally" },
  container: { names: /\b(?:containers?|tubs?|trays?|packag(?:e|es|ing)|cups?|pouches?|wrappers?|bags?)\b/g, es: "Envase o envoltorio", route: "check_locally" },
  cap: { names: /\b(?:caps?|lids?)\b/g, es: "Tapa", route: "check_locally" },
  label: { names: /\blabels?\b/g, es: "Etiqueta", route: "check_locally" },
  chemical_container: { names: /\b(?:pesticide|agrochemical|hazardous chemical|motor oil|solvent|paint) (?:bottles?|containers?|cans?)\b/g, es: "Envase de producto especial", route: "special_collection" },
  battery: { names: /\bbatter(?:ies|y)\b/g, es: "Batería o pila", material: "composite", route: "special_collection" },
  electronics: { names: /\b(?:smartphones?|(?:cell|mobile) phones?|phones?|laptops?|tablets?|keyboards?|computers?|electronic devices?)\b/g, es: "Aparato electrónico", material: "composite", route: "special_collection" },
  bulb: { names: /\b(?:light ?bulbs?|fluorescent tubes?)\b/g, es: "Bombilla o tubo", route: "special_collection" },
  sanitary_waste: { names: /\b(?:diapers?|nappies|wet wipes?|used tissues?|sanitary pads?)\b/g, es: "Residuo sanitario", route: "not_recyclable" },
  food_scraps: { names: /\b(?:banana peels?|apple cores?|food (?:scraps?|waste)|eggshells?)\b/g, es: "Restos de comida", material: "organic", route: "not_recyclable" },
} satisfies Record<string, ObjectRule>;
export type ObjectKind = keyof typeof objects;
export interface ScanItem { object: ObjectKind; material: MaterialFamily; route: SortingRoute }
export interface VisualContext { outcome: ScanOutcome; items: ScanItem[] }
export interface VisionAnalysis extends VisualContext { schema_version: "3.0"; requires_verification: true }
const entries = Object.entries(objects) as [ObjectKind, ObjectRule][];
const materials: [MaterialFamily, RegExp][] = [
  ["plastic", /\b(?:plastic|polyethylene|polypropylene|acrylic)\b/i],
  ["glass", /\bglass\b/i], ["metal", /\b(?:metal(?:lic)?|alumin[i]?um|steel|tin)\b/i],
  ["cardboard", /\b(?:cardboard|paperboard|corrugated board)\b/i], ["paper", /\bpaper\b/i],
];
const scene = /\b(?:tree(?: trunk)?|forest|mountain|landscape|dog|cat|person|people|flower|sky|bird|horse|selfie|building|grass)\b/i;

function materialIn(text: string): MaterialFamily {
  const matches = materials.filter(([, pattern]) => pattern.test(text));
  return matches.length === 1 ? matches[0][0] : "unknown";
}

function addItem(items: ScanItem[], item: ScanItem): void {
  if (items.some(other => other.object === item.object && (other.material === item.material || item.material === "unknown"))) return;
  const placeholder = items.findIndex(other => other.object === item.object && other.material === "unknown");
  if (placeholder >= 0) items[placeholder] = item;
  else if (items.length < 8) items.push(item);
}

function readClause(clause: string, items: ScanItem[]): void {
  // Ignore comparisons, background scenery, hypothetical uses and negated mentions.
  const text = clause.toLowerCase().split(/\b(?:which (?:is|are)|such as|for example|commonly used|typically used|used (?:for|to)|similar to|rather than|in the background|without|there (?:is|are) no|no|does not|not a|not made of)\b/)[0];
  const matches = entries.flatMap(([object, rule]) => Array.from(text.matchAll(rule.names), match => ({
    object, rule, start: match.index, end: match.index + match[0].length, name: match[0],
  }))).sort((a, b) => a.start - b.start);
  for (const [index, match] of matches.entries()) {
    if (matches.slice(0, index).some(prior => prior.end >= match.end)) continue;
    const before = text.slice(matches[index - 1]?.end ?? 0, match.start).split(/[,;:|]|\b(?:and|with|on|behind|near)\b/).at(-1) ?? "";
    const after = text.slice(match.end, matches[index + 1]?.start).match(/^\s*(?:(?:is|are|appears? to be|seems? to be|:|\||-)\s*)?(?:(?:primarily|mostly|clearly|entirely|probably)\s*)?(?:(?:made (?:of|from)|constructed (?:of|from))\s*)?(plastic|glass|metal|alumin[i]?um|steel|cardboard|paper)\b/i);
    // A material before the noun or in its own predicate belongs to this object.
    const prefix = before.split(/\s+/).slice(-4).join(" ");
    const explicit = materialIn(after?.[1] || (prefix + " " + match.name));
    const material = explicit === "unknown" ? match.rule.material ?? "unknown" : explicit;
    const route = match.rule.route ?? (match.rule.accepted?.includes(material) ? "likely_recyclable" : material === "unknown" ? "unknown" : "check_locally");
    addItem(items, { object: match.object, material, route });
  }
}

export function normalizeAnalysis(raw: string): VisionAnalysis {
  const items: ScanItem[] = [];
  const text = raw.length <= 16000 ? raw.trim() : "";
  // Older model output can omit a comma. Read just its product string as data.
  const legacy = text.startsWith("{") ? /^\{\s*"product"\s*:\s*"([^"\\]{1,120})"/.exec(text)?.[1] : undefined;
  const caption = text.startsWith("{") ? legacy ?? "" : text;
  for (const clause of caption.split(/[.!?\n;]/)) readClause(clause, items);
  return decideOutcome(items, caption);
}

export function combineRegions(whole: VisionAnalysis, regions: VisionAnalysis[]): VisionAnalysis {
  const items = [...whole.items];
  for (const region of regions) {
    for (const item of region.items) addItem(items, item);
  }
  // Separate regions can contain the same kind of object in different materials.
  // A known material on one side does not resolve an unclear material on the other.
  for (const item of regions.flatMap(region => region.items)) {
    if (item.route === "unknown" && items.length < 8 && !items.some(other => other.object === item.object && other.material === "unknown")) {
      items.push(item);
    }
  }
  return items.length ? decideOutcome(items, "") : whole;
}

export function refineMaterial(observation: VisionAnalysis, item: ScanItem, answer: string): VisionAnalysis {
  // Accept only an unambiguous short answer referring to the object we asked about.
  const response = answer.toLowerCase().trim().replace(/[.!]$/, "");
  const subject = "the " + item.object + " ";
  const predicate = response.startsWith(subject) ? response.slice(subject.length) : response.replace(/^it /, "");
  const materialWord = /^(?:is (?:made (?:of|from) )?)?(glass|plastic|metal|aluminum|aluminium|steel|paper|cardboard)$/.exec(predicate)?.[1];
  if (!materialWord || item.material !== "unknown") return observation;
  const material = materialIn(materialWord);
  const rule: ObjectRule = objects[item.object];
  const route = rule.accepted?.includes(material) ? "likely_recyclable" : "check_locally";
  return decideOutcome(observation.items.map(other => other === item ? { ...item, material, route } : other), "");
}

function decideOutcome(items: ScanItem[], caption: string): VisionAnalysis {
  const hasCandidate = items.some(item => item.route === "likely_recyclable" || item.route === "special_collection" || item.route === "check_locally" && item.material !== "unknown");
  let outcome: ScanOutcome = "uncertain";
  if (hasCandidate) outcome = "identified";
  else if (items.length && items.every(item => item.route === "not_recyclable")) outcome = "not_recyclable";
  else if (!items.length && scene.test(caption)) outcome = "out_of_scope";
  return { schema_version: "3.0", outcome, items, requires_verification: true };
}

export function objectName(object: ObjectKind, es: boolean): string {
  return es ? objects[object].es : object.replaceAll("_", " ");
}
