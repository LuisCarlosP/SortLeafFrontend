import { getStoredTokens, renewAccountTokens } from "./auth";
import { API_URL } from "./chat-access";

export interface ClassificationRecord {
  id: string;
  materials: string[];
  material: string;
  confidence: number | null;
  isRecyclable: boolean | null;
  timestamp: string;
  imagePreview?: string;
}

export const HISTORY_UPDATED_EVENT = "sortleaf-history-updated";
export const PAGE_SIZE = 50;

async function activityRequest(path: string, method = "GET", signal?: AbortSignal): Promise<Response> {
  const tokens = getStoredTokens();
  const token = tokens?.expires_at && tokens.expires_at <= Date.now() / 1000 + 30
    ? (await renewAccountTokens()).access_token : tokens?.access_token;
  if (!token) throw new Error("account_required");
  const response = await fetch(API_URL + "/activity" + path, {
    method, signal, headers: { Authorization: "Bearer " + token }, cache: "no-store",
  });
  if (!response.ok) throw new Error("activity_unavailable");
  return response;
}

export async function getHistory(after?: ClassificationRecord, signal?: AbortSignal): Promise<ClassificationRecord[]> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (after) { params.set("before", after.timestamp); params.set("before_id", after.id); }
  const response = await activityRequest("?" + params, "GET", signal);
  const rows: {id: string; materials: string[]; confidence: number | null; recyclable: boolean | null; created_at: string}[] = await response.json();
  return rows.map(row => ({ id: row.id, materials: row.materials, material: row.materials.join(", "),
    confidence: row.confidence, isRecyclable: row.recyclable, timestamp: row.created_at }));
}

export async function deleteClassification(id: string): Promise<void> {
  await activityRequest("/" + encodeURIComponent(id), "DELETE");
}

export async function clearHistory(): Promise<void> {
  await activityRequest("", "DELETE");
}

// Material display info
export const getMaterialDisplayName = (material: string, language: 'es' | 'en' = 'es'): string => {
  const names: Record<string, Record<string, string>> = {
    plastic: { es: 'Plástico', en: 'Plastic' },
    glass: { es: 'Vidrio', en: 'Glass' },
    metal: { es: 'Metal', en: 'Metal' },
    paper: { es: 'Papel', en: 'Paper' },
    cardboard: { es: 'Cartón', en: 'Cardboard' },
    trash: { es: 'Basura', en: 'Trash' },
  };
  return names[material]?.[language] || material;
};

export const getMaterialColor = (material: string): string => {
  const colors: Record<string, string> = {
    plastic: '#FFC107',
    glass: '#4CAF50',
    metal: '#9E9E9E',
    paper: '#2196F3',
    cardboard: '#795548',
    trash: '#607D8B',
  };
  return colors[material] || '#2e7d32';
};

export const getMaterialIcon = (material: string): string => {
  const icons: Record<string, string> = {
    plastic: 'fa-bottle-water',
    glass: 'fa-wine-bottle',
    metal: 'fa-ring',
    paper: 'fa-file',
    cardboard: 'fa-box',
    trash: 'fa-trash',
  };
  return icons[material] || 'fa-recycle';
};
