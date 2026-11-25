import { useEffect, useState, useRef, type ReactElement } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Camera,
  ChartNoAxesCombined,
  Layers,
  Search,
  Trash2,
  Clock3,
} from "lucide-react";
import {
  getHistory, PAGE_SIZE, type ClassificationRecord,
  deleteClassification,
  clearHistory,
  HISTORY_UPDATED_EVENT,
} from "../../services/history";
import type { Language } from "../../translations";
import "./StatsPage.css";

interface StatsPageProps {
  language: Language;
}
const MATERIALS: Record<string, [string, string]> = {
  plastic: ["Plástico", "Plastic"],
  glass: ["Vidrio", "Glass"],
  paper: ["Papel", "Paper"],
  cardboard: ["Cartón", "Cardboard"],
  metal: ["Metal", "Metal"],
  trash: ["Otros residuos", "Other waste"],
};
export default function StatsPage({ language }: StatsPageProps): ReactElement {
  const es = language === "es";
  const [history, setHistory] = useState<ClassificationRecord[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const request = useRef<AbortController | null>(null);
  const unavailable = es ? "No pudimos cargar tu actividad." : "We could not load your activity.";
  useEffect(() => {
    const refresh = (): void => setRefreshKey(key => key + 1);
    window.addEventListener(HISTORY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, refresh);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    setLoading(true);
    void getHistory(undefined, controller.signal).then(rows => {
      if (controller.signal.aborted) return;
      setHistory(rows); setMore(rows.length === PAGE_SIZE); setError("");
    }).catch(() => { if (!controller.signal.aborted) setError(unavailable); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => request.current?.abort();
  }, [unavailable, refreshKey]);
  async function loadMore(): Promise<void> {
    if (loading || !more) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const rows = await getHistory(history.at(-1), controller.signal);
      if (controller.signal.aborted) return;
      setHistory(old => [...old, ...rows]); setMore(rows.length === PAGE_SIZE); setError("");
    } catch { if (!controller.signal.aborted) setError(unavailable); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }
  const materialName = (value: string): string =>
    MATERIALS[value]?.[es ? 0 : 1] || value;
  const materials = history.reduce<Record<string, number>>((counts, item) => {
    for (const material of item.materials) counts[material] = (counts[material] || 0) + 1;
    return counts;
  }, {});
  const visible = history.filter((item) =>
    item.materials.map(materialName).join(", ").toLowerCase().includes(filter.toLowerCase()),
  );
  const days = new Set(
    history.map((item) => new Date(item.timestamp).toDateString()),
  ).size;
  const remove = async (id?: string): Promise<void> => {
    if (
      !window.confirm(
        es
          ? id
            ? "¿Eliminar esta clasificación de tu cuenta?"
            : "¿Eliminar todo el historial de clasificaciones de tu cuenta? Los chats se conservan."
          : id
            ? "Delete this classification from your account?"
            : "Delete all classification history from your account? Chats will be kept.",
      )
    )
      return;
    try {
      if (id) await deleteClassification(id);
      else await clearHistory();
      setRefreshKey(key => key + 1);
      setError("");
    } catch {
      setError(
        es
          ? "No pudimos actualizar el historial de tu cuenta."
          : "Could not update history in your account.",
      );
    }
  };
  return (
    <div className="sl-app-page sl-stats-page">
      <header className="sl-app-heading">
        <p className="sl-app-kicker">{es ? "TU ACTIVIDAD" : "YOUR ACTIVITY"}</p>
        <h1>{es ? "Cada consulta cuenta." : "Every question counts."}</h1>
        <p>
          {es
            ? "Vuelve a los materiales que has identificado. Tu historial privado se guarda en tu cuenta. El resumen corresponde a las fotos que has cargado en esta lista."
            : "Revisit the materials you have identified. Your private history is saved to your account. The summary covers the photos loaded in this list."}
        </p>
      </header>
      <div className="sl-stats-summary">
        {[
          {
            icon: Camera,
            value: history.length,
            label: es ? "Fotos analizadas" : "Photos analyzed",
          },
          {
            icon: Layers,
            value: Object.keys(materials).length,
            label: es ? "Tipos de material" : "Material types",
          },
          {
            icon: Clock3,
            value: days,
            label: es ? "Días con actividad" : "Days with activity",
          },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label}>
            <Icon size={20} />
            <strong>{value.toLocaleString(language)}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="sl-app-alert">
          {error}
        </p>
      )}
      {loading && <p role="status">{es ? "Cargando actividad…" : "Loading activity…"}</p>}
      {error && <button onClick={() => setRefreshKey(k => k + 1)}>{es ? "Reintentar" : "Retry"}</button>}
      {history.length === 0 && (loading || error) ? null : history.length === 0 ? (
        <section className="sl-panel sl-empty-state">
          <ChartNoAxesCombined size={42} strokeWidth={1.3} />
          <h2>
            {es
              ? "Tu recorrido empieza con una foto."
              : "Your journey starts with a photo."}
          </h2>
          <p>
            {es
              ? "Comparte una imagen con el asistente. Aquí aparecerán los materiales identificados, listos para consultarlos después."
              : "Share a photo with the assistant. Identified materials will appear here for you to revisit."}
          </p>
          <Link to="/assistant" className="sl-app-button">
            {es ? "Abrir el asistente" : "Open the assistant"}
            <ArrowUpRight size={18} />
          </Link>
        </section>
      ) : (
        <>
          <section className="sl-panel sl-material-overview">
            <div>
              <p className="sl-app-kicker">
                {es ? "LO QUE HAS IDENTIFICADO" : "WHAT YOU HAVE IDENTIFIED"}
              </p>
              <h2>
                {es
                  ? "Tus materiales, de un vistazo."
                  : "Your materials at a glance."}
              </h2>
              <p className="sl-app-note">
                {es
                  ? "Estos datos registran consultas al modelo, no residuos efectivamente reciclados."
                  : "These figures track model predictions, not items confirmed as recycled."}
              </p>
            </div>
            <div className="sl-material-bars">
              {Object.entries(materials)
                .sort((a, b) => b[1] - a[1])
                .map(([material, count]) => (
                  <div key={material}>
                    <div>
                      <span>{materialName(material)}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="sl-material-bars__track">
                      <span
                        style={{ width: `${(count / history.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </section>
          <section className="sl-history">
            <header>
              <h2>
                {es ? "Clasificaciones recientes" : "Recent classifications"}
              </h2>
              <button className="sl-icon-button" onClick={(): void => void remove()}>
                <Trash2 size={16} />
                {es ? "Borrar historial" : "Clear history"}
              </button>
            </header>
            <label className="sl-history-search">
              <Search size={18} />
              <input
                value={filter}
                onChange={(event): void => setFilter(event.target.value)}
                placeholder={
                  es ? "Filtrar por material…" : "Filter by material…"
                }
                aria-label={
                  es
                    ? "Filtrar historial por material"
                    : "Filter history by material"
                }
              />
            </label>
            <ul>
              {visible.map((item) => (
                <li key={item.id}>
                  {item.imagePreview ? (
                    <img src={item.imagePreview} alt="" />
                  ) : (
                    <div className="sl-history__placeholder">
                      <Layers size={20} />
                    </div>
                  )}
                  <div className="sl-history__name">
                    <strong>{item.materials.map(materialName).join(", ")}</strong>
                    <time dateTime={item.timestamp}>
                      {new Date(item.timestamp).toLocaleString(language, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                  <span className="sl-history__confidence">
                    {item.confidence !== null && <>{Math.round(item.confidence * 100)}% <span>{es ? "confianza" : "confidence"}</span></>}
                  </span>
                  <button
                    className="sl-icon-button"
                    aria-label={`${es ? "Eliminar" : "Delete"} ${item.materials.map(materialName).join(", ")}`}
                    onClick={(): void => void remove(item.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </li>
              ))}
            </ul>
            {more && <button disabled={loading} onClick={() => void loadMore()}>{es ? "Cargar más" : "Load more"}</button>}
            {visible.length === 0 && (
              <p className="sl-app-note">
                {es
                  ? "No hay clasificaciones con ese material."
                  : "No classifications match this material."}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
