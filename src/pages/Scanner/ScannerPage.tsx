import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactElement,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  Barcode,
  Camera,
  ScanLine,
  ArrowRight,
  Square,
  LoaderCircle,
  AlertCircle,
  Package,
  Recycle,
  ImagePlus,
} from "lucide-react";
import BarcodeScanner from "../../components/scanner/BarcodeScanner/BarcodeScanner";
import {
  fetchProductByBarcode,
  BarcodeLookupError,
  type ProductInfo,
} from "../../services/barcode";
import type { Language } from "../../translations";
import "./ScannerPage.css";
import { expandUpce, isValidGtin } from "../../services/gtin";

interface ScannerPageProps {
  language: Language;
}
export default function ScannerPage({
  language,
}: ScannerPageProps): ReactElement {
  const es = language === "es";
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => (): void => request.current?.abort(), []);
  const lookup = useCallback(
    async (rawBarcode: string): Promise<void> => {
      const barcode = isValidGtin(rawBarcode)
        ? rawBarcode
        : expandUpce(rawBarcode) || rawBarcode;
      setScanning(false);
      setImageFile(null);
      setProduct(null);
      if (!isValidGtin(barcode)) {
        setError(
          es
            ? "El código no es válido. Revisa sus 8, 12, 13 o 14 dígitos, incluido el último."
            : "Invalid barcode. Check its 8, 12, 13 or 14 digits, including the last one.",
        );
        return;
      }
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);
      setError("");
      setCode(barcode);
      try {
        const result = await fetchProductByBarcode(
          barcode,
          controller.signal,
          es ? "es" : "en",
        );
        if (!controller.signal.aborted) {
          if (result.found) setProduct(result);
          else
            setError(
              es
                ? "No encontramos este producto. Puedes consultar con una foto en el asistente."
                : "This product was not found. Try a photo in the assistant.",
            );
        }
      } catch (failure) {
        const status =
          failure instanceof BarcodeLookupError ? failure.status : 0;
        if (!controller.signal.aborted)
          setError(
            status === 404
              ? es
                ? "Código leído correctamente. Este producto aún no aparece en los catálogos. Puedes consultar su envase con una foto en el asistente."
                : "Barcode read correctly. This product is not in the catalogues yet. Ask the assistant about its packaging with a photo."
              : status === 429 || status === 503
                ? es
                  ? "Los catálogos están ocupados o alcanzaron su límite temporal. Espera un minuto y vuelve a consultar."
                  : "The catalogues are busy or temporarily rate limited. Wait a minute and try again."
                : es
                  ? "No pudimos conectar con el catálogo. Revisa tu conexión y vuelve a consultar."
                  : "Could not connect to the catalogue. Check your connection and try again.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [es],
  );
  const cameraError = useCallback(
    (reason: string): void => {
      setScanning(false);
      setImageFile(null);
      setError(
        reason === "image"
          ? es
            ? "No encontramos un código legible en la foto. Recorta la imagen alrededor de las barras o escribe sus números."
            : "No readable barcode was found. Crop around the bars or enter the numbers."
          : es
            ? "No pudimos abrir la cámara. Revisa los permisos o escribe el código."
            : "Could not open the camera. Check permissions or enter the barcode.",
      );
    },
    [es],
  );
  return (
    <div className="sl-app-page sl-scanner-page">
      <header className="sl-app-heading">
        <p className="sl-app-kicker">
          {es ? "DEL ENVASE AL MATERIAL" : "FROM PACKAGING TO MATERIAL"}
        </p>
        <h1>{es ? "Un código. Más claridad." : "One code. More clarity."}</h1>
        <p>
          {es
            ? "Consulta la información del envase con su código de barras y descubre de qué está hecho."
            : "Look up packaging information with its barcode and find out what it is made of."}
        </p>
      </header>
      <div className="sl-scanner-grid">
        <section
          className="sl-panel sl-scan-card"
          aria-label={es ? "Escanear un producto" : "Scan a product"}
        >
          <div
            className={`sl-scan-view ${scanning || imageFile ? "is-active" : ""}`}
          >
            {scanning || imageFile ? (
              <BarcodeScanner
                isScanning={scanning}
                imageFile={imageFile}
                language={language}
                onScan={lookup}
                onError={cameraError}
              />
            ) : (
              <>
                <div className="sl-scan-frame">
                  <Barcode size={100} strokeWidth={1} />
                </div>
                <p>
                  {es
                    ? "Acerca el código de barras a la cámara"
                    : "Hold the barcode in front of your camera"}
                </p>
              </>
            )}
          </div>
          <div className="sl-scan-controls">
            <button
              className="sl-app-button"
              disabled={loading || !!imageFile}
              onClick={(): void => {
                setError("");
                setScanning(!scanning);
              }}
            >
              {scanning ? <Square size={16} /> : <Camera size={18} />}
              {scanning
                ? es
                  ? "Detener cámara"
                  : "Stop camera"
                : es
                  ? "Activar cámara"
                  : "Start camera"}
            </button>
            <button
              className="sl-app-button sl-app-button--secondary"
              disabled={loading || !!imageFile}
              onClick={(): void => fileInput.current?.click()}
            >
              <ImagePlus size={18} />
              {es ? "Seleccionar foto" : "Select photo"}
            </button>
            <input
              ref={fileInput}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label={es ? "Foto del código de barras" : "Barcode photo"}
              onChange={(event): void => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (
                  !["image/jpeg", "image/png", "image/webp"].includes(
                    file.type,
                  ) ||
                  file.size > 5 * 1024 * 1024
                ) {
                  setError(
                    es
                      ? "Elige una imagen JPG, PNG o WebP de hasta 5 MB."
                      : "Choose a JPG, PNG or WebP image up to 5 MB.",
                  );
                  return;
                }
                setError("");
                setScanning(false);
                setProduct(null);
                setImageFile(file);
              }}
            />
            <p className="sl-app-note">
              {es
                ? "EAN · UPC · GTIN. La foto se lee en tu dispositivo. Solo consultamos el código."
                : "EAN · UPC · GTIN. Photos are read on your device. Only the barcode is looked up."}
            </p>
          </div>
          <form
            className="sl-barcode-form"
            onSubmit={(event: FormEvent): void => {
              event.preventDefault();
              void lookup(code.trim());
            }}
          >
            <label htmlFor="product-code">
              {es
                ? "También puedes escribir el código"
                : "You can also enter the barcode"}
            </label>
            <div>
              <input
                id="product-code"
                inputMode="numeric"
                pattern="[0-9]{8,14}"
                maxLength={14}
                required
                value={code}
                onChange={(event): void =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
                placeholder="Ej. 3017620422003"
                disabled={loading || !!imageFile}
              />
              <button
                type="submit"
                className="sl-icon-button"
                disabled={loading || !!imageFile}
                aria-label={es ? "Consultar código" : "Look up barcode"}
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </form>
        </section>
        <div className="sl-scan-results" aria-live="polite">
          {(loading || imageFile) && (
            <div className="sl-loading-inline" role="status">
              <LoaderCircle className="sl-spin" size={22} />
              {imageFile
                ? es
                  ? "Leyendo el código de la foto…"
                  : "Reading the barcode from your photo…"
                : es
                  ? "Consultando el producto…"
                  : "Looking up the product…"}
            </div>
          )}
          {error && (
            <div className="sl-app-alert" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          {product ? (
            <section className="sl-panel sl-product">
              <div className="sl-product__header">
                {product.image_url && /^https?:\/\//.test(product.image_url) ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    onError={(event): void => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                ) : (
                  <Package size={40} />
                )}
                <div>
                  <p className="sl-app-kicker">{product.brand}</p>
                  <h2>{product.name}</h2>
                  <span>{product.barcode}</span>
                </div>
              </div>
              {product.source_url && /^https:\/\//.test(product.source_url) && (
                <p className="sl-product__source">
                  {es ? "Ficha de" : "Data from"}{" "}
                  <a
                    href={product.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{
                      openfoodfacts: "Open Food Facts",
                      openbeautyfacts: "Open Beauty Facts",
                      openpetfoodfacts: "Open Pet Food Facts",
                      openproductsfacts: "Open Products Facts",
                      upcitemdb: "UPCitemdb",
                    }[product.source || ""] || product.source}
                  </a>
                  {product.source !== "upcitemdb" && " · ODbL"}
                </p>
              )}
              <h3>{es ? "Acerca del envase" : "About the packaging"}</h3>
              {product.recycling_info.length ? (
                product.recycling_info.map((info, index) => (
                  <div className="sl-product__material" key={index}>
                    <Recycle size={18} />
                    <div>
                      <strong>
                        {info.material === "Unknown"
                          ? es
                            ? "Material no identificado"
                            : "Unidentified material"
                          : info.material}
                      </strong>
                      <p>{info.tip}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="sl-app-note">
                  {es
                    ? "Este producto no incluye información del envase."
                    : "Packaging information is not available for this product."}
                </p>
              )}
              <p className="sl-app-note">
                {es
                  ? "Las indicaciones del catálogo pueden variar según el país. Confirma las normas de tu localidad."
                  : "Catalog guidance may vary by country. Confirm your local rules."}
              </p>
              <Link
                className="sl-app-button sl-app-button--secondary"
                to="/map"
              >
                {es ? "Encontrar un punto" : "Find a location"}
                <ArrowRight size={16} />
              </Link>
              <p className="sl-app-note">
                <Link to="/assistant">{es ? "Consultar el envase con una foto" : "Ask about the packaging with a photo"}</Link>
              </p>
            </section>
          ) : (
            <section className="sl-scan-explainer">
              <ScanLine size={28} />
              <h2>
                {es
                  ? "Conoce lo que tienes en tus manos."
                  : "Know what is in your hands."}
              </h2>
              <p>
                {es
                  ? "Consultamos catálogos de alimentos, belleza, mascotas y otros productos. Si una ficha no está disponible, puedes seguir con una foto en el asistente."
                  : "We search food, beauty, pet food and general product catalogues. If an entry is unavailable, continue with a photo in the assistant."}
              </p>
              <ol>
                <li>
                  {es
                    ? "Encuentra el código del envase."
                    : "Find the barcode on the packaging."}
                </li>
                <li>
                  {es
                    ? "Escanéalo, sube una foto o escribe sus números."
                    : "Scan it, upload a photo or enter its numbers."}
                </li>
                <li>
                  {es
                    ? "Consulta los materiales y cómo separarlos."
                    : "Check the materials and sorting guidance."}
                </li>
              </ol>
              <p className="sl-app-note">
                {es ? "Datos abiertos de " : "Open data from "}
                <a
                  href="https://world.openfoodfacts.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Food Facts
                </a>
                {es
                  ? " y sus catálogos asociados (ODbL). Búsqueda complementaria con UPCitemdb."
                  : " and its associated catalogues (ODbL). Additional lookup through UPCitemdb."}
              </p>
              <Link to="/assistant">
                {es
                  ? "¿Sin código? Pregúntale al asistente"
                  : "No barcode? Ask the assistant"}
                <ArrowRight size={17} />
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
