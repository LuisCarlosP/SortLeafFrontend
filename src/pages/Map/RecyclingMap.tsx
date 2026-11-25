import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactElement,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L, { type Map as LeafletMap } from "leaflet";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ExternalLink,
  LocateFixed,
  LoaderCircle,
  MapPin,
  Navigation,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  calculateDistance,
  fetchRecyclingPoints,
  MAP_POINT_LIMIT,
  formatDistance,
  getCurrentPosition,
  type Coordinates,
  type RecyclingPoint,
} from "../../services/location";
import type { Language } from "../../translations";
import "leaflet/dist/leaflet.css";
import "./RecyclingMap.css";

interface RecyclingMapProps {
  language: Language;
}
interface MapBridgeProps {
  mapRef: MutableRefObject<LeafletMap | null>;
  result: MapResult | null;
}
interface MapResult {
  origin: Coordinates;
  points: RecyclingPoint[];
  partial: boolean;
  catalogDate?: string | null;
}
const DEFAULT_CENTER: Coordinates = { latitude: 9.9325, longitude: -84.0796 };
const FILTERS = [
  "plastic",
  "glass",
  "paper",
  "cardboard",
  "metal",
  "batteries",
  "electronics",
  "clothes",
];
const MATERIALS = {
  es: {
    plastic: "Plástico",
    glass: "Vidrio",
    paper: "Papel",
    cardboard: "Cartón",
    metal: "Metal",
    batteries: "Pilas",
    electronics: "Electrónicos",
    clothes: "Textiles",
    general: "General",
    organic: "Orgánicos",
    oil: "Aceite",
    medicine: "Medicamentos",
  },
  en: {
    plastic: "Plastic",
    glass: "Glass",
    paper: "Paper",
    cardboard: "Cardboard",
    metal: "Metal",
    batteries: "Batteries",
    electronics: "Electronics",
    clothes: "Textiles",
    general: "General",
    organic: "Organic",
    oil: "Oil",
    medicine: "Medicine",
  },
};
const COPY = {
  es: {
    title: "Encuentra su próximo destino.",
    subtitle: "Explora los puntos de reciclaje",
    filters: "Filtrar materiales",
    all: "Todos los materiales",
    locate: "Usar mi ubicación",
    loading: "Buscando puntos…",
    origin: "Centro de búsqueda",
    incomplete: "Resultados parciales.",
    locationError:
      "No pudimos acceder a tu ubicación. Revisa el permiso de ubicación del navegador.",
    error: "No pudimos cargar los puntos.",
    retry: "Reintentar",
    empty: "No encontramos puntos. Prueba con otro material.",
    caution: "Confirma los materiales aceptados y el horario antes de ir.",
    accepts: "MATERIALES",
    directions: "Cómo llegar",
    website: "Sitio web",
    call: "Llamar",
    close: "Cerrar",
    location: "Tu ubicación",
    reference: "Referencia: San José, Costa Rica",
    hours: "Horario",
    clear: "Limpiar filtros",
    selected: "Punto seleccionado",
  },
  en: {
    title: "Find its next destination.",
    subtitle: "Explore recycling locations",
    filters: "Filter materials",
    all: "All materials",
    locate: "Use my location",
    loading: "Finding locations…",
    origin: "Search center",
    incomplete: "Partial results.",
    locationError:
      "We could not access your location. Check your browser’s location permission.",
    error: "Could not load locations.",
    retry: "Retry",
    empty: "No locations found. Try another material.",
    caution: "Confirm accepted materials and opening hours before visiting.",
    accepts: "MATERIALS",
    directions: "Get directions",
    website: "Website",
    call: "Call",
    close: "Close",
    location: "Your location",
    reference: "Reference: San José, Costa Rica",
    hours: "Opening hours",
    clear: "Clear filters",
    selected: "Selected location",
  },
};

function longitudeNear(longitude: number, origin: number): number {
  return origin + L.Util.wrapNum(longitude - origin, [-180, 180], true);
}

function MapBridge({ mapRef, result }: MapBridgeProps): null {
  const map = useMap();
  useEffect((): void => {
    mapRef.current = map;
  }, [map, mapRef]);
  useEffect(() => {
    if (!result?.points.length) return;
    const { origin, points } = result;
    const bounds = L.latLngBounds([[origin.latitude, origin.longitude]]);
    for (const point of points) {
      bounds.extend([point.latitude, longitudeNear(point.longitude, origin.longitude)]);
    }
    const height = map.getSize().y;
    map.fitBounds(bounds, {
      maxZoom: 15, animate: false,
      paddingTopLeft: [32, Math.min(115, height * 0.20)],
      paddingBottomRight: [32, Math.min(110, height * 0.18)],
    });
  }, [map, result]);
  return null;
}

function pointIcon(selected: boolean): L.DivIcon {
  return L.divIcon({
    className: "sl-map-marker-wrap",
    html: `<span class="sl-map-marker ${selected ? "is-selected" : ""}"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>`,
    iconSize: [40, 44],
    iconAnchor: [20, 43],
  });
}
const LOCATION_ICON = L.divIcon({
  className: "sl-location-marker",
  html: "<span></span>",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});
const ORIGIN_ICON = L.divIcon({
  className: "sl-map-origin", iconSize: [14, 14], iconAnchor: [7, 7],
});
function safeWebsite(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export default function RecyclingMap({
  language,
}: RecyclingMapProps): ReactElement {
  const copy = COPY[language];
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const center = userLocation ?? DEFAULT_CENTER;
  const [originReady, setOriginReady] = useState(false);
  const locationRequest = useRef(0);
  const [result, setResult] = useState<MapResult | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [reload, setReload] = useState(0);
  const mapRef = useRef<LeafletMap | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const locate = useCallback(async (): Promise<void> => {
    const requestId = ++locationRequest.current;
    setLocating(true);
    setLocationError(false);
    try {
      const position = await getCurrentPosition();
      if (requestId !== locationRequest.current) return;
      setUserLocation(position);
      mapRef.current?.setView([position.latitude, position.longitude], 14);
    } catch {
      if (requestId === locationRequest.current) setLocationError(true);
    } finally {
      if (requestId === locationRequest.current) {
        setLocating(false);
        setOriginReady(true);
      }
    }
  }, []);

  useEffect(() => {
    const requestId = locationRequest.current;
    const initialize = async (): Promise<void> => {
      let granted = false;
      try {
        const permission = await navigator.permissions?.query({ name: "geolocation" });
        granted = permission?.state === "granted";
      } catch {
        // Permission inspection is optional. The location button also works without it.
      }
      if (requestId !== locationRequest.current) return;
      if (granted) await locate();
      else setOriginReady(true);
    };
    void initialize();
    return () => { locationRequest.current += 1; };
  }, [locate]);

  useEffect(() => {
    if (!originReady) return;
    const controller = new AbortController();
    let active = true;
    // Run the lifecycle in one async operation; stale searches never replace newer results.
    const load = async (): Promise<void> => {
      setLoading(true);
      setError(false);
      setResult(null);
      setSelectedId(null);
      try {
        const data = await fetchRecyclingPoints(
          center.latitude,
          center.longitude,
          selectedTypes,
          controller.signal,
        );
        if (active) {
          const ranked = data.points.filter(point => !selectedTypes.length ||
            point.types.some(type => selectedTypes.includes(type))).map(point => ({
            ...point, distance: point.distance ?? calculateDistance(center.latitude, center.longitude, point.latitude, point.longitude),
          })).sort((a, b) => a.distance - b.distance);
          setResult({ origin: center, points: ranked.slice(0, MAP_POINT_LIMIT), partial: data.partial, catalogDate: data.catalog_date });
          setSelectedId(null);
        }
      } catch {
        if (active) {
          setError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return (): void => {
      active = false;
      controller.abort();
    };
  }, [center, originReady, reload, selectedTypes]);

  useEffect((): (() => void) | undefined => {
    if (!filtersOpen) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setFiltersOpen(false);
        filterButtonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent): void => {
      if (
        event.target instanceof Node &&
        !filtersRef.current?.contains(event.target) &&
        !filterButtonRef.current?.contains(event.target)
      )
        setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return (): void => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [filtersOpen]);

  const visiblePoints = result?.points ?? [];
  const selected = visiblePoints.find(
    (point): boolean => point.id === selectedId,
  );
  const materialName = (type: string): string =>
    MATERIALS[language][type as keyof typeof MATERIALS.es] || type;
  const website = safeWebsite(selected?.website);

  return (
    <section className="sl-map-workspace" aria-label={copy.subtitle}>
      <h1 className="sl-visually-hidden">{copy.title}</h1>
      <MapContainer
        center={[DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude]}
        zoom={14}
        zoomControl={false}
        className="sl-full-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ZoomControl position="bottomleft" />
        <MapBridge mapRef={mapRef} result={result} />
        {!userLocation && (
          <Marker position={[center.latitude, center.longitude]} icon={ORIGIN_ICON} alt={copy.origin} title={copy.origin} />
        )}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={LOCATION_ICON}
            title={copy.location}
          />
        )}
        {visiblePoints.map(
          (point): ReactElement => (
            <Marker
              key={point.id}
              position={[point.latitude, longitudeNear(point.longitude, center.longitude)]}
              icon={pointIcon(point.id === selectedId)}
              title={point.name}
              alt={point.name}
              zIndexOffset={point.id === selectedId ? 1000 : 0}
              eventHandlers={{ click: (): void => setSelectedId(point.id) }}
            />
          ),
        )}
      </MapContainer>
      <div className="sl-map-controls">
        <div className="sl-map-controls__row">
          <button
            ref={filterButtonRef}
            className={`sl-map-control ${selectedTypes.length ? "is-active" : ""}`}
            aria-expanded={filtersOpen}
            aria-controls="sl-map-filters"
            onClick={(): void => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={17} />
            {selectedTypes.length
              ? `${copy.filters} (${selectedTypes.length})`
              : copy.all}
            <ChevronDown size={15} />
          </button>
        </div>
        {filtersOpen && (
          <div className="sl-map-filters" id="sl-map-filters" ref={filtersRef}>
            <div>
              <strong>{copy.filters}</strong>
              <button
                className="sl-icon-button"
                aria-label={copy.close}
                onClick={(): void => setFiltersOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="sl-map-filters__options">
              {FILTERS.map(
                (type): ReactElement => (
                  <button
                    key={type}
                    aria-pressed={selectedTypes.includes(type)}
                    onClick={(): void =>
                      setSelectedTypes((current): string[] =>
                        current.includes(type)
                          ? current.filter((item): boolean => item !== type)
                          : [...current, type],
                      )
                    }
                  >
                    {selectedTypes.includes(type) && <Check size={15} />}
                    {materialName(type)}
                  </button>
                ),
              )}
            </div>
            <button
              className="sl-map-filters__clear"
              onClick={(): void => setSelectedTypes([])}
            >
              {copy.clear}
            </button>
          </div>
        )}
        <p className="sl-map-status" role="status">
          {loading ? (
            <>
              <LoaderCircle className="sl-spin" size={14} />
              {copy.loading}
            </>
          ) : error ? (
            copy.error
          ) : (
            <>
              <span className="sl-map-status__dot" />
              {visiblePoints.length === MAP_POINT_LIMIT && !result?.partial
                ? (language === "es" ? "Los 10 puntos más cercanos" : "The 10 nearest locations")
                : language === "es"
                  ? visiblePoints.length + (visiblePoints.length === 1 ? " punto registrado" : " puntos registrados")
                  : visiblePoints.length + (visiblePoints.length === 1 ? " listed location" : " listed locations")}
              {result?.partial && ` · ${copy.incomplete}`}
            </>
          )}
          {(error || result?.partial) && (
            <button className="sl-map-retry" onClick={() => setReload(value => value + 1)}>
              {copy.retry}
            </button>
          )}
        </p>
      </div>
      <div className="sl-map-actions">
        <button
          className="sl-map-control sl-map-locate"
          disabled={locating}
          onClick={(): void => {
            void locate();
          }}
          title={copy.locate}
          aria-label={copy.locate}
        >
          {locating ? (
            <LoaderCircle className="sl-spin" size={20} />
          ) : (
            <LocateFixed size={20} />
          )}
        </button>
      </div>
      {locationError && (
        <div className="sl-map-toast" role="alert">
          {copy.locationError}
          <button
            className="sl-icon-button"
            aria-label={copy.close}
            onClick={(): void => setLocationError(false)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {!loading && !error && visiblePoints.length === 0 && (
        <div className="sl-map-empty">
          <MapPin size={21} />
          <p>{copy.empty}</p>
        </div>
      )}
      {selected && (
        <aside className="sl-map-detail" aria-label={copy.selected}>
          <div className="sl-map-detail__top">
            <span>
              <MapPin size={17} />
              {copy.selected}
            </span>
            <button
              className="sl-icon-button"
              aria-label={copy.close}
              onClick={(): void => setSelectedId(null)}
            >
              <X size={20} />
            </button>
          </div>
          <h2>{selected.name}</h2>
          {selected.address && <p>{selected.address}</p>}
          {selected.distance !== undefined && (
            <p className="sl-map-detail__distance">
              {formatDistance(selected.distance)} ·{" "}
              {language === "es"
                ? "desde el centro de búsqueda"
                : "from search center"}
            </p>
          )}
          <h3>{copy.accepts}</h3>
          <div className="sl-map-detail__tags">
            {selected.types.map(
              (type): ReactElement => (
                <span key={type}>{materialName(type)}</span>
              ),
            )}
          </div>
          {selected.openingHours && (
            <p>
              <strong>{copy.hours}</strong>
              <br />
              {selected.openingHours}
            </p>
          )}
          <p className="sl-app-note">{copy.caution}</p>
          <a
            className="sl-app-button"
            href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Navigation size={17} />
            {copy.directions}
            <ArrowUpRight size={16} />
          </a>
          <div className="sl-map-detail__links">
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer">
                {copy.website}
                <ExternalLink size={14} />
              </a>
            )}
            {selected.phone && (
              <a href={`tel:${selected.phone.replace(/[^+\d]/g, "")}`}>
                {copy.call}
              </a>
            )}
          </div>
        </aside>
      )}
      <span className="sl-map-source">
        {userLocation ? copy.location : copy.reference}
        {result?.catalogDate && ` · OSM Costa Rica · ${new Intl.DateTimeFormat(language, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(result.catalogDate))}`}
      </span>
    </section>
  );
}
