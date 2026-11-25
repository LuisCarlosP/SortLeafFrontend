import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Language } from '../../translations';

interface PrivacyPageProps {
  language: Language;
}

const PRIVACY_CONTENT = {
  es: {
    back: 'Volver al inicio',
    eyebrow: 'INFORMACIÓN DE SORTLEAF',
    title: 'Tus datos, con claridad.',
    introduction: 'Esta página explica qué información utiliza SortLeaf al usar sus herramientas y cómo puedes consultar sobre ella.',
    ownerTitle: 'Quién está detrás',
    owner: 'SortLeaf es un proyecto de Luis Carlos Picado Rojas. Para consultas sobre tus datos o solicitudes de acceso, corrección o eliminación, escribe a',
    contactTitle: 'Cuando nos escribes',
    contact: 'El formulario solicita tu nombre, correo y mensaje. Con tu autorización, estos datos se envían mediante EmailJS al responsable del proyecto para responder tu consulta. Enviar un mensaje no te suscribe a comunicaciones comerciales. También puedes contactarnos directamente por correo.',
    toolsTitle: 'Cuando utilizas las herramientas',
    tools: [
      'Clasificación: al solicitar un análisis, la imagen que seleccionas o capturas se envía al servidor de SortLeaf para identificar el material. Evita incluir personas, documentos o información sensible en la fotografía.',
      'Asistente: tus preguntas y el contexto del material se envían al servidor y al servicio de inteligencia artificial utilizado para generar la respuesta. Evita compartir datos personales innecesarios en el chat.',
      'El mapa usa tu ubicación si ya diste permiso. También puedes activarla con el botón de ubicación. Enviamos las coordenadas al servidor para encontrar los puntos de reciclaje más cercanos. Usamos cartografía de OpenStreetMap. Al pedir indicaciones, se abre el proveedor de rutas.',
      'Escáner: la cámara requiere tu permiso. La lectura de la cámara y de las fotos se realiza en tu dispositivo; las imágenes del escáner no se suben al servidor. Solo el código se consulta en los catálogos Open Food Facts, Open Beauty Facts, Open Pet Food Facts, Open Products Facts o UPCitemdb. Las fichas consultadas se guardan temporalmente en el servidor.',
      'Cuenta: si te registras o inicias sesión, tus datos de cuenta se procesan mediante el servicio de autenticación. La información de perfil y los tokens de sesión se guardan en este navegador para mantener tu sesión.',
    ],
    storageTitle: 'Información en tu navegador',
    storage: 'Tu navegador guarda el idioma y las credenciales de la sesión. Al registrarte, Supabase utiliza Resend para enviarte el enlace de confirmación. Tu foto de perfil es privada y la app la carga con tu sesión. Supabase guarda los chats privados y, si inicias sesión con una cuenta, tu actividad de clasificación. Puedes eliminar la actividad desde Mi actividad.',
    permissionsTitle: 'Permisos y servicios externos',
    permissions: 'Puedes retirar los permisos de cámara y ubicación desde tu navegador. Las funciones que los necesitan dejarán de estar disponibles hasta que los permitas de nuevo. Los servicios externos tienen sus propias prácticas de tratamiento de datos; consulta también la política de privacidad de EmailJS y la de OpenStreetMap.',
    emailPolicy: 'Privacidad de EmailJS',
    mapPolicy: 'Privacidad de OpenStreetMap',
    questionsTitle: 'Consultas y eliminación',
    questions: 'Si necesitas consultar o solicitar la eliminación de información enviada al proyecto, contacta al responsable e indica qué función utilizaste. Borrar los datos de tu navegador no elimina automáticamente información enviada al servidor o por correo.',
  },
  en: {
    back: 'Back to home',
    eyebrow: 'SORTLEAF INFORMATION',
    title: 'Your information, explained.',
    introduction: 'This page explains what information SortLeaf uses when you use its tools and how to ask questions about it.',
    ownerTitle: 'Who is responsible',
    owner: 'SortLeaf is a project by Luis Carlos Picado Rojas. For questions about your information or requests to access, correct or delete it, email',
    contactTitle: 'When you contact us',
    contact: 'The contact form asks for your name, email address and message. With your permission, this information is sent through EmailJS to the project owner to answer your question. Sending a message does not subscribe you to marketing communications. You can also contact us directly by email.',
    toolsTitle: 'When you use the tools',
    tools: [
      'Classification: when you request an analysis, the image you select or capture is sent to the SortLeaf server to identify its material. Avoid including people, documents or sensitive information in the photo.',
      'Assistant: your questions and the material context are sent to the server and the artificial intelligence service used to generate a response. Avoid sharing unnecessary personal information in chat.',
      'The map uses your location if you have already granted permission. You can also enable it with the location button. Your coordinates are sent to the server to find the nearest recycling locations. The map uses OpenStreetMap tiles. Getting directions opens the routing provider.',
      'Scanner: camera access requires your permission. Camera frames and photos are read on your device; scanner images are not uploaded. Only the barcode is looked up in Open Food Facts, Open Beauty Facts, Open Pet Food Facts, Open Products Facts or UPCitemdb. Product entries are temporarily cached on the server.',
      'Account: if you register or sign in, your account information is processed by the authentication service. Profile information and session tokens are stored in this browser to keep you signed in.',
    ],
    storageTitle: 'Information in your browser',
    storage: 'Your browser keeps your language preference and session credentials. When you register, Supabase uses Resend to deliver your confirmation link. Your profile photo is private and the app uses your session to load it. Supabase stores private chats and, for signed-in accounts, classification activity. You can delete activity from My activity.',
    permissionsTitle: 'Permissions and external services',
    permissions: 'You can revoke camera and location permissions in your browser. Features that need them will be unavailable until you grant permission again. External services have their own data practices; also review the EmailJS and OpenStreetMap privacy policies.',
    emailPolicy: 'EmailJS privacy policy',
    mapPolicy: 'OpenStreetMap privacy policy',
    questionsTitle: 'Questions and deletion',
    questions: 'To ask about or request deletion of information sent to the project, contact the owner and identify the feature you used. Clearing browser data does not automatically delete information sent to the server or by email.',
  },
};

export default function PrivacyPage({ language }: PrivacyPageProps): ReactElement {
  const content = PRIVACY_CONTENT[language];

  return (
    <div className="sl-legal sl-container">
      <article>
        <Link className="sl-legal__back" to="/"><ArrowLeft size={18} aria-hidden="true" />{content.back}</Link>
        <p className="sl-eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.introduction}</p>
        <h2>{content.ownerTitle}</h2>
        <p>{content.owner} <a href="mailto:picadoluiscarlos@gmail.com">picadoluiscarlos@gmail.com</a>.</p>
        <h2>{content.contactTitle}</h2>
        <p>{content.contact}</p>
        <h2>{content.toolsTitle}</h2>
        <ul>{content.tools.map((item: string): ReactElement => <li key={item}>{item}</li>)}</ul>
        <h2>{content.storageTitle}</h2>
        <p>{content.storage}</p>
        <p>{language === 'es' ? 'Como invitado, puedes recuperar tus chats desde el mismo perfil del navegador mientras conserves la sesión. Quien use ese perfil puede abrirlos. Al borrar los datos del sitio pierdes el acceso de invitado. Puedes borrar cada conversación desde la barra lateral. Se guardan las preguntas, el contexto del análisis y las respuestas. Las fotos y sus miniaturas solo aparecen mientras está abierta la conversación en el dispositivo.' : 'As a guest, you can reopen chats from the same browser profile while you retain the session. Anyone using that profile can open them. Clearing site data removes guest access. Delete a conversation from the sidebar. Saved chats include questions, analysis context and replies. Photos and thumbnails are shown only while the conversation is open on the device.'}</p>
        <h2>{content.permissionsTitle}</h2>
        <p>{content.permissions}</p>
        <ul>
          <li><a href="https://www.emailjs.com/legal/privacy-policy/" target="_blank" rel="noreferrer">{content.emailPolicy}</a></li>
          <li><a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noreferrer">{content.mapPolicy}</a></li>
        </ul>
        <h2>{content.questionsTitle}</h2>
        <p>{content.questions}</p>
      </article>
    </div>
  );
}
