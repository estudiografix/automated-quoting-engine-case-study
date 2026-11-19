<div align="right">
  🌐 <strong>Idioma / Language:</strong> <a href="./03-setup-guide.md">🇺🇸 Read in English</a> | 🇦🇷 <strong>Español</strong>
</div>

# 🛠️ 03. Guía de Implementación y Despliegue (Setup Guide)

Esta guía documenta paso a paso cómo replicar e instalar el motor de presupuestos automatizado utilizando únicamente cuentas gratuitas de **Google Workspace / Gmail**, **Jotform** y **Netlify / GitHub Pages**.

---

## 📋 Requisitos Previos ($0 Cost Stack)

1. **Cuenta de Google** (Google Drive, Google Sheets, Google Slides y Google Apps Script).
2. **Cuenta de Jotform** (Plan Starter gratuito).
3. **Hosting estático gratuito** (GitHub Pages o Netlify) para alojar [`src/landing/index.html`](../src/landing/index.html).

---

## Paso 1: Configurar la Plantilla Maestra en Google Slides

1. Crea una presentación nueva en **Google Slides** con configuración de página vertical **A4 (`21 × 29.7 cm`)**.
2. Diseña el fondo estático (o impórtalo como imagen de fondo exportada desde **Adobe InDesign / Figma** para asegurar fidelidad tipográfica y evitar que se muevan las cajas).
3. Coloca cajas de texto con los tokens dinámicos detallados en [`templates/slides-tokens-reference.es.md`](../templates/slides-tokens-reference.es.md):
   * Encabezado: `{{NRO_GENERADO}}`, `{{fecha}}`, `{{validez_dias}}`
   * Cliente y Vehículo: `{{cliente_nombre}}`, `{{cuit_cuil}}`, `{{direccion}}`, `{{telefono}}`, `{{vehiculo_marca}}`, `{{vehiculo_modelo}}`, `{{vehiculo_patente}}`, `{{vehiculo_km}}`
   * Observaciones: `{{observacion_cliente}}`, `{{diagnostico}}`
   * Tabla de ítems (`1` al `12`): `{{cant_1}}`, `{{descripcion_1}}`, `{{un_1}}`, `{{im_1}}` ... hasta `_12` y `{{total}}`.
   * QR dinámico: Crea un cuadro de texto cuadrado en el pie de página que contenga exactamente el texto `{{QR_MAPS}}`.
4. Copia el **ID de la presentación** desde la URL de tu navegador:
   `https://docs.google.com/presentation/d/TU_TEMPLATE_ID_AQUI/edit`

---

## Paso 2: Preparar el Google Sheet (`Presupuestos` + `AUX`)

1. Crea un archivo de Google Sheets y conecta la integración nativa de tu formulario de **Jotform** hacia la primera pestaña llamada `Presupuestos`.
2. Crea una segunda pestaña llamada exactamente **`AUX`**.
3. Configura en la fila `1` de `AUX` los encabezados documentados en [`templates/sheets-schema.es.md`](../templates/sheets-schema.es.md) y pega las fórmulas matriciales en la fila `2`.
4. Copia el **ID del Google Sheet** desde la URL:
   `https://docs.google.com/spreadsheets/d/TU_SHEET_ID_AQUI/edit`

---

## Paso 3: Desplegar Google Apps Script (`main.gs` + `webapp.gs` + `postenvio.html`)

1. Dentro de tu Google Sheet, ve a **Extensiones → Apps Script**.
2. Crea los siguientes archivos dentro del editor de Apps Script copiando el contenido de la carpeta [`/src`](../src):
   * `main.gs`: Pega el código de [`src/main.gs`](../src/main.gs) y reemplaza `YOUR_GOOGLE_SLIDES_TEMPLATE_ID_HERE` por el ID de tu plantilla de Google Slides.
   * `webapp.gs`: Pega el código de [`src/webapp.gs`](../src/webapp.gs) y reemplaza `YOUR_GOOGLE_SHEET_ID_HERE` por el ID de tu Google Sheet.
   * `postenvio.html`: Crea un archivo HTML llamado `postenvio` (sin extensión `.html` en el nombre del archivo dentro de Apps Script) y pega el contenido de [`src/postenvio.html`](../src/postenvio.html).
3. **Publicar la WebApp:**
   * Haz clic en **Implementar → Nueva implementación**.
   * Tipo: **Aplicación web (Web App)**.
   * Ejecutar como: **Yo (propietario)**.
   * Quién tiene acceso: **Cualquier persona**.
   * Copia la URL generada (`https://script.google.com/macros/s/.../exec`) y pégala en `CONFIG.WEBAPP_URL` dentro de `main.gs`.
4. **Activar el Trigger Automático:**
   * Recarga el Google Sheet. Verás aparecer el menú personalizado **Presupuestos Expert**.
   * Haz clic en **Presupuestos Expert → Configurar Trigger (1 min)** y autoriza los permisos de ejecución.

---

## Paso 4: Estilizar Jotform y Conectar la Redirección Post-Envío

1. En el constructor de **Jotform**, abre el **Diseñador de Formularios → Estilos → Inyectar CSS Personalizado** y pega el contenido de [`src/styles/jotform-custom.css`](../src/styles/jotform-custom.css).
2. Ve a **Ajustes → Página de Agradecimiento (Thank You Page)**, selecciona **Redirigir a un enlace externo después del envío** e ingresa la URL de tu WebApp pasando la variable `{id}` de Jotform:
   ```text
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID_HERE/exec?xid={id}
   ```
3. ¡Listo! Cada vez que un empleado envíe el formulario, será redirigido a la pantalla de carga con polling en tiempo real y en segundos tendrá habilitados los botones para **Abrir el PDF** o **Enviar por WhatsApp**.
