import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Language } from '../../translations';

interface ResourcesPageProps {
  language: Language;
}

const RESOURCE_CONTENT = {
  es: {
    back: 'Volver al inicio',
    eyebrow: 'HECHO CON CUIDADO',
    title: 'Recursos y créditos.',
    introduction: 'La identidad de SortLeaf combina diseño propio con fotografías, tipografías e iconos que permiten su uso gratuito. Estas son sus fuentes y licencias.',
    photosTitle: 'Fotografías',
    hero: 'Portada: botella de plástico sobre un fondo neutro.',
    secondary: 'Guía de materiales: botellas de vidrio bajo luz natural.',
    photoLicense: 'La fotografía de portada usa Unsplash License y la de vidrio, Pexels License. Se han recortado y optimizado para esta web. Los créditos son un reconocimiento a sus autores; las personas fotografiadas no representan ni respaldan SortLeaf.',
    pexelsLink: 'Consultar la licencia de Pexels',
    fontsTitle: 'Tipografías',
    outfit: 'Outfit, de The Outfit Project Authors, para titulares y el logotipo.',
    manrope: 'Manrope, de The Manrope Project Authors, para lectura e interfaz.',
    fontLicense: 'Ambas se distribuyen bajo SIL Open Font License 1.1 y se sirven desde este sitio. Se conservan sus avisos de copyright y licencia.',
    iconsTitle: 'Iconos',
    icons: 'La landing utiliza Lucide, de Lucide Icons and Contributors, bajo licencia ISC, con avisos MIT para los iconos derivados de Feather de Cole Bemis.',
    iconLicense: 'Licencia y avisos de Lucide',
    brandTitle: 'Identidad SortLeaf',
    brand: 'El símbolo, el logotipo y sus composiciones se han creado para este proyecto. La licencia de los recursos externos no modifica los derechos sobre la marca ni sobre el código de la aplicación.',
  },
  en: {
    back: 'Back to home',
    eyebrow: 'MADE WITH CARE',
    title: 'Resources and credits.',
    introduction: 'The SortLeaf identity combines original design with photography, typefaces and icons that allow free use. Here are their sources and licenses.',
    photosTitle: 'Photography',
    hero: 'Hero: plastic bottle against a neutral background.',
    secondary: 'Material guide: glass bottles in natural light.',
    photoLicense: 'The hero photograph uses the Unsplash License and the glass photograph uses the Pexels License. They have been cropped and optimized for this website. Credits acknowledge their creators; the people pictured do not represent or endorse SortLeaf.',
    pexelsLink: 'Read the Pexels license',
    fontsTitle: 'Typefaces',
    outfit: 'Outfit, by The Outfit Project Authors, for headings and the wordmark.',
    manrope: 'Manrope, by The Manrope Project Authors, for body text and the interface.',
    fontLicense: 'Both are distributed under the SIL Open Font License 1.1 and are served from this website. Their copyright and license notices are preserved.',
    iconsTitle: 'Icons',
    icons: 'The landing page uses Lucide, by Lucide Icons and Contributors, under the ISC license, with MIT notices for icons derived from Feather by Cole Bemis.',
    iconLicense: 'Lucide license and notices',
    brandTitle: 'SortLeaf identity',
    brand: 'The symbol, wordmark and compositions were created for this project. External asset licenses do not change the rights to the brand or application code.',
  },
};

export default function ResourcesPage({ language }: ResourcesPageProps): ReactElement {
  const content = RESOURCE_CONTENT[language];
  const licenseBase = `${import.meta.env.BASE_URL}brand/sortleaf/licenses/`;

  return (
    <div className="sl-legal sl-container">
      <article>
        <Link className="sl-legal__back" to="/"><ArrowLeft size={18} aria-hidden="true" />{content.back}</Link>
        <p className="sl-eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.introduction}</p>
        <h2>{content.photosTitle}</h2>
        <ul>
          <li>{content.hero} <a href="https://unsplash.com/photos/clear-plastic-bottle-on-white-table-edBR3b2JAuA" target="_blank" rel="noreferrer">charlesdeluvio / Unsplash</a>.</li>
          <li>{content.secondary} <a href="https://www.pexels.com/photo/close-up-shot-of-empty-glass-bottles-7191423/" target="_blank" rel="noreferrer">cottonbro studio / Pexels</a>.</li>
        </ul>
        <p>{content.photoLicense}</p>
        <p><a href="https://unsplash.com/license" target="_blank" rel="noreferrer">Unsplash License</a></p>
        <p><a href="https://www.pexels.com/legal-pages/license/" target="_blank" rel="noreferrer">{content.pexelsLink}</a></p>
        <h2>{content.fontsTitle}</h2>
        <ul>
          <li>{content.outfit} <a href={`${licenseBase}OFL-Outfit.txt`}>Outfit OFL</a></li>
          <li>{content.manrope} <a href={`${licenseBase}OFL-Manrope.txt`}>Manrope OFL</a></li>
        </ul>
        <p>{content.fontLicense}</p>
        <h2>{content.iconsTitle}</h2>
        <p>{content.icons}</p>
        <p><a href={`${licenseBase}Lucide-LICENSE.txt`}>{content.iconLicense}</a></p>
        <h2>{language === 'es' ? 'Visión local experimental' : 'Experimental local vision'}</h2>
        <p>{language === 'es' ? 'El laboratorio utiliza Transformers.js y los modelos SmolVLM de Hugging Face (Apache-2.0), junto con ONNX Runtime de Microsoft (MIT). Los pesos se descargan desde Hugging Face al solicitar la carga del modelo.' : 'The lab uses Transformers.js and Hugging Face SmolVLM models (Apache-2.0), together with Microsoft ONNX Runtime (MIT). Model weights are downloaded from Hugging Face when you request a model load.'}</p>
        <ul>
          <li><a href={`${import.meta.env.BASE_URL}licenses/vision/Transformers-LICENSE.txt`}>Transformers.js — Apache-2.0</a></li>
          <li><a href={`${import.meta.env.BASE_URL}licenses/vision/ONNX-Runtime-LICENSE.txt`}>ONNX Runtime — MIT</a> · <a href={`${import.meta.env.BASE_URL}licenses/vision/ONNX-Runtime-ThirdPartyNotices.txt`}>{language === 'es' ? 'Avisos de terceros' : 'Third-party notices'}</a></li>
          <li><a href="https://huggingface.co/HuggingFaceTB/SmolVLM-256M-Instruct" target="_blank" rel="noreferrer">SmolVLM 256M</a> · <a href="https://huggingface.co/HuggingFaceTB/SmolVLM-500M-Instruct" target="_blank" rel="noreferrer">SmolVLM 500M</a></li>
        </ul>
        <h2>{content.brandTitle}</h2>
        <p>{content.brand}</p>
      </article>
    </div>
  );
}
