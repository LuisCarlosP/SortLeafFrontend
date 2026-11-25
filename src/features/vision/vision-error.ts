import type { Language } from "../../translations";

export function diagnostic(error: unknown): string {
  return String(error instanceof Error ? error.message : error)
    .replace(/(https?:\/\/[^\s?#]+)[?#][^\s]*/g, "$1")
    .slice(0, 800);
}

export function visionErrorText(code: string, detail: string, language: Language): string {
  const es = language === "es";
  if (code === "unsupported") return es ? "Este navegador no admite el escaneo local. Elige SortLeaf para continuar." : "This browser cannot scan locally. Choose SortLeaf to continue.";
  if (code === "timeout") return es ? "El modelo tardó demasiado. Prueba el modelo de 256M." : "The model timed out. Try the 256M model.";
  if (/wasm|webassembly\.instantiate|magic word|module script|dynamically imported|text\/html|worker script/i.test(detail)) return es ? "El navegador no pudo iniciar el motor local. Recarga esta página y vuelve a cargar el modelo." : "The local runtime could not start. Refresh this page and load the model again.";
  if (/fetch|network|download|local_files_only|remote file|403|404|offline/i.test(detail)) return es ? "Faltan archivos del modelo. Comprueba la conexión y vuelve a descargarlos." : "Model files are missing. Check your connection and download them again.";
  if (/memory|allocation|buffer size|out of bounds/i.test(detail)) return es ? "El equipo alcanzó su límite de memoria. Cierra otras pestañas o elige el modelo de 256M." : "The device reached its memory limit. Close other tabs or choose the 256M model.";
  if (/webgpu|adapter|device lost|shader/i.test(detail)) return es ? "La GPU no pudo ejecutar el modelo. Prueba otro navegador compatible con WebGPU." : "The GPU could not run the model. Try another WebGPU browser.";
  return code === "inference" ? (es ? "Se interrumpió la respuesta local. Vuelve a cargar el modelo." : "Local inference stopped. Reload the model.") : (es ? "No se pudo cargar el modelo en este navegador." : "The model could not load in this browser.");
}
