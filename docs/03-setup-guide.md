<div align="right">
  🌐 <strong>Language / Idioma:</strong> 🇺🇸 <strong>English</strong> | <a href="./03-setup-guide.es.md">🇦🇷 Leer en Español</a>
</div>

# 🛠️ 03. Setup & Deployment Guide

This guide documents how to replicate and deploy the automated quoting engine from scratch using only free tiers of **Google Workspace / Gmail**, **Jotform**, and **Netlify / GitHub Pages**.

---

## 📋 Prerequisites ($0 Cost Stack)

1. **Google Account** (Google Drive, Google Sheets, Google Slides, and Google Apps Script).
2. **Jotform Account** (Free Starter Plan).
3. **Static Hosting** (GitHub Pages or Netlify) to host [`src/landing/index.html`](../src/landing/index.html).

---

## Step 1: Set Up the Master Template in Google Slides

1. Create a new presentation in **Google Slides** configured to vertical **A4 (`21 × 29.7 cm`)** page dimensions.
2. Design the static background grid (or import it as a high-res background image exported from **Adobe InDesign / Figma** so staff cannot accidentally shift layout boxes).
3. Place text boxes containing the dynamic tokens detailed in [`templates/slides-tokens-reference.md`](../templates/slides-tokens-reference.md):
   * Header: `{{NRO_GENERADO}}`, `{{fecha}}`, `{{validez_dias}}`
   * Customer & Vehicle: `{{cliente_nombre}}`, `{{cuit_cuil}}`, `{{direccion}}`, `{{telefono}}`, `{{vehiculo_marca}}`, `{{vehiculo_modelo}}`, `{{vehiculo_patente}}`, `{{vehiculo_km}}`
   * Notes: `{{observacion_cliente}}`, `{{diagnostico}}`
   * Line Item Matrix (`1` to `12`): `{{cant_1}}`, `{{descripcion_1}}`, `{{un_1}}`, `{{im_1}}` ... through `_12`, plus `{{total}}`.
   * Dynamic QR: Place a square shape in the footer containing the exact text `{{QR_MAPS}}`.
4. Copy the **Presentation ID** from your browser URL:
   `https://docs.google.com/presentation/d/YOUR_TEMPLATE_ID_HERE/edit`

---

## Step 2: Prepare the Google Sheet (`Presupuestos` + `AUX`)

1. Create a Google Sheet and connect your **Jotform** native integration so submissions land in the first tab named `Presupuestos`.
2. Create a second tab named **`AUX`**.
3. Set up the row `1` headers documented in [`templates/sheets-schema.md`](../templates/sheets-schema.md) and paste the array formulas in row `2`.
4. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`

---

## Step 3: Deploy Google Apps Script (`main.gs` + `webapp.gs` + `postenvio.html`)

1. Inside your Google Sheet, navigate to **Extensions → Apps Script**.
2. Create the following files inside the Apps Script editor using the sanitized files in [`/src`](../src):
   * `main.gs`: Paste [`src/main.gs`](../src/main.gs) and replace `YOUR_GOOGLE_SLIDES_TEMPLATE_ID_HERE` with your Google Slides Template ID.
   * `webapp.gs`: Paste [`src/webapp.gs`](../src/webapp.gs) and replace `YOUR_GOOGLE_SHEET_ID_HERE` with your Google Sheet ID.
   * `postenvio.html`: Create an HTML file named `postenvio` (omit `.html` inside the Apps Script file list) and paste [`src/postenvio.html`](../src/postenvio.html).
3. **Publish as Web App:**
   * Click **Deploy → New deployment**.
   * Type: **Web App**.
   * Execute as: **Me (owner)**.
   * Who has access: **Anyone**.
   * Copy the generated Web App URL (`https://script.google.com/macros/s/.../exec`) and paste it into `CONFIG.WEBAPP_URL` inside `main.gs`.
4. **Enable the Automated Trigger:**
   * Reload the Google Sheet. A custom menu named **Presupuestos Expert** will appear.
   * Click **Presupuestos Expert → Configurar Trigger (1 min)** and authorize OAuth scopes.

---

## Step 4: Style Jotform & Connect Post-Submit Redirect

1. In the **Jotform Form Builder**, open **Form Designer → Styles → Inject Custom CSS** and paste [`src/styles/jotform-custom.css`](../src/styles/jotform-custom.css).
2. Go to **Settings → Thank You Page**, select **Redirect to an external link after submission**, and enter your Web App URL passing Jotform's `{id}` variable:
   ```text
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID_HERE/exec?xid={id}
   ```
3. Done! Every time an employee submits the form, they will be routed to the real-time polling screen and within seconds will have active buttons to **Open the PDF** or **Send via WhatsApp**.
