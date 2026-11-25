import type { ReactElement } from "react";
import type { Language } from "../../translations";
import type { ScanItem } from "./analysis-schema";
import { itemDescription } from "./sorting-copy";
import "./ScanItems.css";

export default function ScanItems({ items, language }: { items: ScanItem[]; language: Language }): ReactElement | null {
  if (!items.length) return null;
  return <ul className="sl-scan-items" aria-label={language === "es" ? "Objetos y materiales probables" : "Objects and likely materials"}>
    {items.map(item => {
      const { name, material, advice } = itemDescription(item, language);
      return <li key={item.object + item.material}><strong>{name} · {material}</strong><span>{advice}</span></li>;
    })}
  </ul>;
}
