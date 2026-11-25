import type { Language } from "../../translations";
import { objectName, type MaterialFamily, type ScanItem, type ScanOutcome, type SortingRoute } from "./analysis-schema";

const materialNames: Record<MaterialFamily, [string, string]> = {
  plastic: ["Plástico", "Plastic"], metal: ["Metal", "Metal"], glass: ["Vidrio", "Glass"], paper: ["Papel", "Paper"],
  cardboard: ["Cartón", "Cardboard"], composite: ["Mezcla de materiales", "Mixed materials"], organic: ["Orgánico", "Organic"], unknown: ["Material por confirmar", "Material unconfirmed"],
};
const routes: Record<SortingRoute, [string, string]> = {
  likely_recyclable: ["Probablemente reciclable si tu centro lo acepta limpio y vacío.", "Likely recyclable if your local program accepts it clean and empty."],
  special_collection: ["Requiere un punto de recogida especial.", "Take this to a dedicated collection point."],
  not_recyclable: ["Fuera del reciclaje ordinario.", "Keep out of ordinary recycling."],
  check_locally: ["Consulta si tu centro acepta esta pieza.", "Check whether your collection point accepts this item."],
  unknown: ["Hace falta ver el material o su etiqueta.", "Show the material or its label more clearly."],
};
const outcomes: Record<ScanOutcome, [string, string]> = {
  identified: ["Cómo separar lo que aparece en la foto", "How to sort the items in this photo"],
  not_recyclable: ["Lo que se distingue queda fuera del reciclaje ordinario. Intenta otra vez con un objeto reciclable.", "The visible items do not belong in ordinary recycling. Try again with a recyclable item."],
  out_of_scope: ["No se distingue un residuo para clasificar. Intenta otra vez con un objeto reciclable en primer plano.", "No waste item could be identified. Try again with a recyclable object in the foreground."],
  uncertain: ["No hay suficiente detalle para decidir. Acerca el objeto y fotografía la etiqueta o el material con buena luz.", "There is too little detail to decide. Move closer and photograph the label or material in good light."],
};
export function scanTitle(outcome: ScanOutcome, language: Language): string { return outcomes[outcome][language === "es" ? 0 : 1]; }
export function itemDescription(item: ScanItem, language: Language): { name: string; material: string; advice: string } {
  const i = language === "es" ? 0 : 1;
  return { name: objectName(item.object, language === "es"), material: materialNames[item.material][i], advice: routes[item.route][i] };
}

