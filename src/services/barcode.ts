export interface RecyclingInfo {
  material: string;
  recyclable: boolean | null;
  bin: string | null;
  tip: string;
  bin_type?: string;
}

export interface ProductInfo {
  source?: string;
  source_url?: string;
  found: boolean;
  barcode: string;
  name: string;
  brand: string;
  image_url: string | null;
  packaging: string;
  categories: string;
  recycling_info: RecyclingInfo[];
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY || "";

export class BarcodeLookupError extends Error {
  status: number;
  constructor(status: number) {
    super(`Barcode lookup: ${status}`);
    this.status = status;
  }
}

export const fetchProductByBarcode = async (
  barcode: string,
  signal?: AbortSignal,
  language = "es",
): Promise<ProductInfo> => {
  const response = await fetch(
    `${API_URL}/barcode/${encodeURIComponent(barcode)}?language=${language}`,
    {
      signal,
      headers: {
        "X-API-Key": API_KEY,
      },
    },
  );

  if (!response.ok) {
    throw new BarcodeLookupError(response.status);
  }

  return response.json();
};
