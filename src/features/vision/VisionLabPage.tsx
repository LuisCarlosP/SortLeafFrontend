import { useEffect, useRef, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Camera, Download, ImagePlus, LoaderCircle, ScanLine, ShieldCheck, Trash2, X } from "lucide-react";
import CameraDialog from "../../components/workspace/CameraDialog";
import type { Language } from "../../translations";
import { detectVisionCapability, type VisionCapability } from "./capability-profile";
import { VISION_CACHE_NAME, VISION_MODELS, type VisionModelKey } from "./model-registry";
import { prepareVisionImage } from "./prepare-image";
import { useVisionSession } from "./use-vision-session";
import { visionErrorText } from "./vision-error";
import ScanItems from "./ScanItems";
import { scanTitle } from "./sorting-copy";
import "./VisionLabPage.css";

interface SelectedImage { blob: Blob; url: string; id: number }

export default function VisionLabPage({ language }: { language: Language }): ReactElement {
  const es = language === "es";
  const session = useVisionSession();
  const [capability, setCapability] = useState<VisionCapability | null>(null);
  const [model, setModel] = useState<VisionModelKey>("smol-256m");
  const [photo, setPhoto] = useState<SelectedImage | null>(null);
  const [step, setStep] = useState<"photo" | "model" | "result">("photo");
  const stageTitle = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const [camera, setCamera] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<"cleared" | "failed" | null>(null);
  const [clearing, setClearing] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const imageSequence = useRef(0);
  const mounted = useRef(true);
  const busy = session.status === "loading" || session.status === "analyzing";
  const ready = session.status === "ready" && session.model === model;
  const definition = VISION_MODELS[model];
  const latest = session.history.filter((run): boolean => run.imageId === photo?.id).at(-1);
  const files = Object.values(session.files);
  const loadedMb = files.reduce((sum, file): number => sum + file.loaded, 0) / 1_000_000;

  useEffect((): (() => void) => {
    mounted.current = true;
    void detectVisionCapability().then((result): void => { if (mounted.current) setCapability(result); });
    return (): void => { mounted.current = false; imageSequence.current += 1; };
  }, []);
  useEffect((): (() => void) => (): void => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  const selectPhoto = async (file?: File): Promise<void> => {
    if (!file || busy) return;
    const id = ++imageSequence.current;
    setPreparing(true); setImageError(false); setCamera(false);
    try {
      const blob = await prepareVisionImage(file);
      if (mounted.current && id === imageSequence.current) {
        setPhoto({ blob, url: URL.createObjectURL(blob), id });
        setStep("model");
      }
    } catch { if (mounted.current && id === imageSequence.current) setImageError(true); }
    finally { if (mounted.current && id === imageSequence.current) setPreparing(false); }
  };
  useEffect((): void => {
    if (previousStep.current !== step) stageTitle.current?.focus();
    previousStep.current = step;
  }, [step]);
  const clearCache = async (): Promise<void> => {
    session.cancel(); setClearing(true); setCacheMessage(null);
    try { await caches.delete(VISION_CACHE_NAME); setCacheMessage("cleared"); }
    catch { setCacheMessage("failed"); }
    finally { setClearing(false); }
  };
  const exportRuns = (): void => {
    const blob = new Blob([JSON.stringify({ schema: "sortleaf-vision-pilot-v1", note: "Unverified visual hypotheses. No images included. Loaded bytes may include cache reads. Run 1 includes first-inference setup. Not an accuracy benchmark.", runs: session.history }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "sortleaf-vision-results.json"; anchor.click();
    setTimeout((): void => URL.revokeObjectURL(url), 1000);
  };

  return <section className="sl-vision">
    <header className="sl-vision__heading">
      <h1>{es ? "Visión local" : "Local vision"}</h1>
      <p><ShieldCheck size={17} aria-hidden="true" />{es ? "Identifica materiales con una foto en tu dispositivo." : "Identify materials from a photo on your device."}</p>
    </header>
    <nav className="sl-vision__steps" aria-label={es ? "Pasos del análisis" : "Analysis steps"}>
      {(["photo", "model", "result"] as const).map((stage, index) => (
        <button key={stage} type="button" aria-current={step === stage ? "step" : undefined}
          disabled={busy || preparing || clearing || (stage === "result" && !latest)}
          onClick={() => setStep(stage)}>
          <span aria-hidden="true">{index + 1}</span>{(es ? ["Foto", "Modelo", "Resultado"] : ["Photo", "Model", "Result"])[index]}
        </button>
      ))}
    </nav>
    {step === "photo" && <section className="sl-vision__panel">
          <h2 ref={stageTitle} tabIndex={-1}>{es ? "Elige una foto" : "Choose a photo"}</h2>
          <div className={`sl-vision__photo ${photo ? "sl-vision__photo--filled" : ""}`}>
            {photo ? <><img src={photo.url} alt={es ? "Producto seleccionado para el análisis" : "Product selected for analysis"} /><span className="sl-vision__photo-tag">{es ? "Foto" : "Photo"} {photo.id}</span></> : <><ImagePlus size={38} strokeWidth={1.2} /><strong>{es ? "Objetos separados y con buena luz." : "Separate the objects and use good light."}</strong><p>{es ? "Acércate y deja sus partes visibles." : "Move closer and keep its parts visible."}</p></>}
          </div>
          <input ref={upload} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label={es ? "Seleccionar foto" : "Select photo"} onChange={(event): void => { void selectPhoto(event.target.files?.[0]); event.target.value = ""; }} />
          <div className="sl-vision__actions">
            <button className="sl-app-button sl-app-button--secondary" disabled={busy || preparing || clearing} onClick={(): void => upload.current?.click()}><ImagePlus size={17} />{es ? "Subir foto" : "Upload photo"}</button>
            <button className="sl-app-button sl-app-button--secondary" disabled={busy || preparing || clearing} onClick={(): void => setCamera(true)}><Camera size={17} />{es ? "Cámara" : "Camera"}</button>
          </div>
          <p className="sl-vision__fine">JPG, PNG, WebP · {es ? "Hasta 10 MB. Se adapta a 1024 px para el análisis." : "Up to 10 MB. Resized to 1024 px for analysis."}</p>
          {preparing && <p role="status">{es ? "Preparando foto…" : "Preparing photo…"}</p>}
          {imageError && <p className="sl-vision__alert" role="alert">{es ? "No se pudo abrir la foto. Usa JPG, PNG o WebP de hasta 10 MB y 48 megapíxeles." : "Could not open this photo. Use JPG, PNG or WebP up to 10 MB and 48 megapixels."}</p>}
          {photo && <button className="sl-app-button" disabled={preparing} onClick={() => setStep("model")}>{es ? "Continuar con esta foto" : "Continue with this photo"}</button>}
    </section>}

    {step === "model" && <section className="sl-vision__panel">
          <h2 ref={stageTitle} tabIndex={-1}>{es ? "Prepara la IA local" : "Prepare local AI"}</h2>
          {photo && <div className="sl-vision__preview"><img src={photo.url} alt={es ? "Foto seleccionada" : "Selected photo"} /><button className="sl-vision__text-button" disabled={busy} onClick={() => setStep("photo")}>{es ? "Cambiar foto" : "Change photo"}</button></div>}
          <fieldset className="sl-vision__models" disabled={busy || clearing}>
            <legend className="sl-sr-only">{es ? "Modelo de visión" : "Vision model"}</legend>
            {(Object.entries(VISION_MODELS) as [VisionModelKey, typeof definition][]).map(([key, item]): ReactElement => <label key={key} className={model === key ? "is-selected" : ""}><input type="radio" name="vision-model" value={key} checked={key === model} onChange={(): void => setModel(key)} /><span><strong>{item.label}</strong><small>{key === "smol-256m" ? (es ? "Menor descarga" : "Smaller download") : (es ? "Para comparar calidad" : "Compare quality")}</small></span><span>≈ {item.estimatedMb} MB</span></label>)}
          </fieldset>
          <p className="sl-vision__fine">{es ? "La primera carga descarga el modelo de Hugging Face y puede tardar varios minutos." : "The first load downloads the model from Hugging Face and may take several minutes."}</p>
          <p className="sl-vision__compatibility" role="status">{!capability ? (es ? "Comprobando compatibilidad…" : "Checking compatibility…") : capability.supported ? (es ? "WebGPU disponible." : "WebGPU available.") : capability.reason === "insecure" ? (es ? "Este modo necesita HTTPS o localhost. Una dirección HTTP de tu PC abierta desde Android no habilita WebGPU." : "This mode requires HTTPS or localhost. Opening your PC's HTTP address from Android does not enable WebGPU.") : (es ? "Este navegador no ofrece WebGPU compatible. Puedes continuar con el escáner de códigos." : "This browser does not offer compatible WebGPU. You can continue with the barcode scanner.")}</p>
          {!busy && !ready && <button className="sl-app-button sl-app-button--secondary sl-vision__wide" disabled={!capability?.supported || clearing} onClick={(): void => session.load(model)}><Download size={17} />{es ? `Cargar ${definition.label}` : `Load ${definition.label}`}</button>}
          {session.status === "loading" && <div className="sl-vision__progress" role="status"><LoaderCircle size={18} className="sl-vision__spin" /><span>{es ? "Descargando y preparando…" : "Downloading and preparing…"}<small>{loadedMb.toFixed(1)} MB {es ? "leídos · pueden provenir de caché" : "read · may come from cache"}</small></span></div>}
          {session.cacheUnavailable && <p className="sl-vision__alert" role="status">{es ? "No se pudieron guardar todos los archivos. Puede ser necesaria otra descarga en tu próxima visita." : "Some files could not be cached. Another download may be needed on your next visit."}</p>}
          {session.status === "cancelled" && <p className="sl-vision__fine" role="status">{es ? "Modelo descargado de la memoria. Puedes cargarlo otra vez desde los archivos guardados." : "Model released from memory. You can reload it from cached files."}</p>}
          {session.error && <div className="sl-vision__alert" role="alert"><p>{visionErrorText(session.error, session.detail, language)}</p>{session.detail && <details><summary>{es ? "Detalle técnico" : "Technical details"}</summary><code>{session.detail}</code></details>}</div>}
          <div className="sl-vision__actions">
            {ready && <button className="sl-app-button sl-vision__wide" disabled={clearing} onClick={() => {
              if (!photo) { setStep("photo"); return; }
              session.analyze(photo.blob, photo.id);
              setStep("result");
            }}><ScanLine size={18} />{photo ? (es ? "Analizar foto" : "Analyze photo") : (es ? "Elegir una foto" : "Choose a photo")}</button>}
            {busy && <button className="sl-app-button sl-app-button--secondary" onClick={session.cancel}><X size={16} />{es ? "Cancelar" : "Cancel"}</button>}
          </div>
          <button className="sl-vision__text-button" disabled={busy || clearing} onClick={(): void => { void clearCache(); }}><Trash2 size={14} />{es ? "Eliminar modelos guardados" : "Delete cached models"}</button>
          {cacheMessage && <p className="sl-vision__fine" role="status">{cacheMessage === "cleared" ? (es ? "Caché de modelos eliminada." : "Model cache deleted.") : (es ? "El navegador no permitió eliminar la caché." : "Your browser did not allow cache deletion.")}</p>}
    </section>}

    {step === "result" && <section className="sl-vision__panel" aria-busy={busy}>
        <h2 ref={stageTitle} tabIndex={-1}>{es ? "Resultado de reciclaje" : "Recycling result"}</h2>
        {session.status === "analyzing" ? <div className="sl-vision__progress" role="status">
          <LoaderCircle className="sl-vision__spin" size={18} />{es ? "Analizando la foto…" : "Analyzing the photo…"}
          <button className="sl-vision__text-button" onClick={() => { session.cancel(); setStep("model"); }}>{es ? "Cancelar" : "Cancel"}</button>
        </div> : session.error ? <div className="sl-vision__alert" role="alert">
          {visionErrorText(session.error, session.detail, language)}
          <button className="sl-vision__text-button" onClick={() => setStep("model")}>{es ? "Volver al modelo" : "Back to model"}</button>
        </div> : latest && <>
          <div className="sl-vision__result-heading" aria-live="polite"><h3>{scanTitle(latest.result.analysis.outcome, language)}</h3></div>
          <ScanItems items={latest.result.analysis.items} language={language} />
          {latest.result.analysis.outcome === "identified" && <p className="sl-vision__fine">{es ? "El material es probable. Confírmalo con la etiqueta y consulta qué recibe tu centro de acopio." : "Material identification is approximate. Check the label and your local collection program."}</p>}
          <details className="sl-vision__details"><summary>{es ? "Ver JSON y salida del modelo" : "View JSON and model output"}</summary><pre>{JSON.stringify(latest.result.analysis, null, 2)}</pre><pre>{latest.result.raw}</pre></details>
          <div className="sl-vision__actions">
            <button className="sl-app-button" onClick={() => setStep("photo")}>{es ? "Elegir otra foto" : "Choose another photo"}</button>
            <button className="sl-app-button sl-app-button--secondary" onClick={() => setStep("model")}>{es ? "Comparar modelos" : "Compare models"}</button>
          </div>
        </>}
        {!busy && session.history.length > 0 && <details className="sl-vision__comparison">
          <summary>{es ? "Historial de análisis" : "Analysis history"} ({session.history.length})</summary>
          <div className="sl-vision__table-wrap"><table><thead><tr><th>{es ? "Foto" : "Photo"}</th><th>{es ? "Modelo" : "Model"}</th><th>{es ? "Tiempo" : "Time"}</th><th>{es ? "Objetos" : "Items"}</th></tr></thead><tbody>{session.history.map((run, index): ReactElement => <tr key={index}><td>#{run.imageId}</td><td>{VISION_MODELS[run.result.metrics.model].label}</td><td>{(run.result.metrics.inferenceMs / 1000).toFixed(1)} s</td><td>{run.result.analysis.items.length}</td></tr>)}</tbody></table></div><button className="sl-vision__text-button" onClick={exportRuns}><Download size={16} />{es ? "Exportar resultados (sin fotos)" : "Export results (without photos)"}</button><p className="sl-vision__fine">{es ? "El archivo incluye las descripciones y el texto que el modelo haya leído. Revísalo antes de compartirlo." : "The file includes descriptions and text the model may have read. Review it before sharing."}</p>
        </details>}
    </section>}
    {capability && !capability.supported && step !== "result" && <Link to="/scanner" className="sl-vision__link">{es ? "Abrir escáner" : "Open scanner"}<ArrowUpRight size={16} /></Link>}
    {camera && <CameraDialog language={language} onClose={(): void => setCamera(false)} onCapture={(file): void => { void selectPhoto(file); }} />}
  </section>;
}
