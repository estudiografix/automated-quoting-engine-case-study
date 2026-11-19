<div align="right">
  🌐 <strong>Language / Idioma:</strong> 🇺🇸 <strong>English</strong> | <a href="./02-ux-decisions-and-tradeoffs.es.md">🇦🇷 Leer en Español</a>
</div>

# 🧠 02. In-Situ Research, UX Decisions & Trade-off Analysis

## 1. Reframing the Brief: From "Making a Template" to Designing a Service

The project started with a straightforward request from **Lubricantes Sur**'s operations manager:
> *"We need a nicer, easier-to-use template to hand out to customers who ask for quotes."*

Approaching this with a **Product & Service Design mindset**, delivering a static Word or Canva template would have been an operational failure: **visual consistency still depended on 5 to 6 different employees—working in a high-traffic automotive shop—manually typing, copying, and adding numbers on a calculator during spare moments.**

Because I also managed the company's digital channels and social media presence, I spotted something critical: the quoting workflow wasn't an isolated graphic problem—**it was a systemic operational bottleneck that was actively damaging online reputation and profit margins.**

---

## 2. The 7 Pain Points Uncovered During In-Situ Research

Through direct shop-floor observation, stakeholder interviews (owner, manager, and counter staff), and an audit of historical documents and WhatsApp/Google Maps channels, I identified 7 core problems:

### 1️⃣ Inflationary Exposure & Missing Validity Dates
In Argentina's high-inflation environment, Word quotes frequently went out without an issue date or expiration window. Customers returned weeks or months later demanding the old price:
* If the owner honored the outdated quote to avoid conflict, **the business lost money**.
* If the price was updated at the counter, the customer felt cheated, causing **immediate friction and distrust**.

### 2️⃣ Manual Math Errors & Omitted Items (Direct Impact on Google Reviews)
Assembling quotes in a rush between walk-in customers led to frequent addition errors or incomplete filter/oil descriptions. This translated directly into 1-star reviews on Google Business Profile, undermining all social media branding efforts:

> ★☆☆☆☆ **Real Google Maps Review:**
> *"One day I went in for a quote and they told me 108k for changing all filters and oil. I booked an appointment for the next day, and when I showed up they tried to charge me 140k, got angry, charged me 108k, and didn't change the fuel filter (without even telling me)."*

### 3️⃣ Lack of Internal Accountability
With 5 to 6 employees sharing the counter computer, Word documents had no author attribution. Whenever a pricing mistake happened, the owner couldn't tell who had issued the quote or whether it was an isolated slip or a recurring habit, creating tension across the entire team.

### 4️⃣ Commercial & Financial Blindness
There was zero centralized tracking of total monthly quoted volume, quotes per employee, or recurring corporate/fleet customers.

### 5️⃣ File Naming & Archival Chaos
Files were saved locally with arbitrary names, typos, or random numbers (for instance, the real legacy file `PRESUPUEST0 MUUNI (1).docx`, spelled with a zero instead of an "O" and containing manually spaced numbers like `$4 8 000` and `TOTAL:$3 66 .000`).

### 6️⃣ Friction in the "Last Mile" (WhatsApp Delivery)
Pressed for time, staff sent raw file attachments over WhatsApp without a greeting, using curt phrasing or ALL-CAPS text. A competitively priced quote could easily be lost to a competitor due to a cold, rushed digital touchpoint.

### 7️⃣ No Segmentation Between Retail & Fleet Customers
The exact same improvised Word document was used to quote a single car's oil change and a multi-vehicle municipal or corporate fleet (`UNIDAD SALVEIRO DOMINIO: AB773KZ / AB773LA / AB773KY`).

---

## 3. Real Evidence: Before vs. After

| Criterion | ❌ Before (`PRESUPUEST0 MUUNI (1).docx`) | ✅ After (`Presupuesto_P-2025-252.pdf`) |
| :--- | :--- | :--- |
| **Output format** | Plain inline text in Word, no tabular grid, editable and prone to tampering. | Immutable A4 PDF, editorially gridded in Adobe InDesign and automated via Google Slides. |
| **Price calculation** | Manual calculator math (`$4 8 000`, `TOTAL:$3 66 .000`). High error rate. | 100% automated in `AUX` sheet (`Quantity × Unit Price = Subtotal` and `TOTAL`). |
| **Traceability** | Anonymous, unnumbered, no database record. | Unique sequential ID (`P-2025-252`), operator attribution (`Luci`), and timestamp. |
| **Commercial validity** | Inconsistent (frequently forgotten). | `{{validez_dias}}` token pre-filled at `15 días` alongside automatic date. |
| **WhatsApp delivery** | Manual, tone varied wildly depending on staff rush. | Direct `wa.me` button with warm pre-filled greeting and public Google Drive PDF link. |

---

## 4. Architecture Trade-off Analysis ($0 Budget Constraint)

To scale beyond 50–100 monthly quotes with **$0 USD/month** in recurring licensing fees, I evaluated 4 technical paths before building the final hybrid engine:

| Evaluated Option | Complexity | Scalability | PDF Aesthetics | Data Control | Verdict & Rationale |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Option A: Jotform + Sheets + Document Studio / AutoCrat** | 🟢 Low | 🟡 Capped by free quotas | 🟢 High | 🟢 Good | **Prototyped & Outgrown:** Tested initially, but free-tier monthly limits and the inability to build a custom post-submit WhatsApp screen led to replacing the add-on with custom Apps Script code. |
| **Option B: Fillout + Airtable / Notion + Make** | 🟡 Medium | 🟢 Yes (Paid) | 🟡 Medium | 🟢 Excellent | **Discarded:** Great database UX, but external PDF generators and Make webhooks required paid monthly subscriptions at scale. |
| **Option C: Glide App / Softr (No-Code App)** | 🟡 Medium | 🟢 Yes (Paid) | 🟢 High | 🟢 Excellent | **Discarded:** Offered per-employee logins, but free plans restricted rows/users and didn't justify a fixed monthly SaaS cost. |
| **Option D: Custom Web App (React + Backend)** | 🔴 High | 🟢 Full | 🟢 Full | 🟢 Full | **Discarded as Over-engineering:** Reserved only for a future stage exceeding 500+ quotes/month. |
| **✅ Implemented Solution: HTML Hub + Jotform CSS + Sheets (`AUX`) + Apps Script + Slides** | 🟡 Medium | 🟢 Unlimited ($0) | 🟢 Print-grade (InDesign → Slides) | 🟢 Full | **Selected:** **$0/month** operating cost, full end-to-end UI control, and sub-minute PDF + WhatsApp generation. |

---

## 5. Micro-UX Decisions That Drove Adoption

1. **Cross-Platform Visual Cohesion:**
   Even though the workflow spans 3 distinct technologies (Static HTML on Netlify → Jotform → Google Apps Script WebApp), staff experience **a single native Lubricantes Sur application**. I ruled out third-party builders like *Carrd* for the entry hub and hand-coded it in HTML/CSS using the exact same typography (`Antonio` and `Fira Sans`), border radii (`20px`), and color tokens (`#FFD500`, `#D70613`, `#000000`).
2. **Car Brand Dropdown with Conditional Escape (`Marca` → `OTRA MARCA` → `MARCA FINAL`):**
   To speed up mobile entry, employees pick from the most common local car brands (Volkswagen, Peugeot, Ford, Renault, Toyota, Chevrolet, Fiat) in a single tap. For rarer vehicles, selecting `"Otra (especificar)"` reveals a conditional text input. While this creates 3 columns in the raw Jotform sheet, the `AUX` sheet silently merges them into a single clean `vehiculo_marca` token.
3. **Separating Public Diagnostics from Silent Internal Notes:**
   Staff needed a way to record internal shop warnings or verbal agreements that **should not appear on the customer's PDF** but must remain auditable in the database. I added the `Comentario interno` field with explicit microcopy: *"Internal information or note not visible to customers (what is written here does not go on the quote)"*.
