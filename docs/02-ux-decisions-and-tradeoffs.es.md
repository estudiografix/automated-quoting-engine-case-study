<div align="right">
  🌐 <strong>Idioma / Language:</strong> <a href="./02-ux-decisions-and-tradeoffs.md">🇺🇸 Read in English</a> | 🇦🇷 <strong>Español</strong>
</div>

# 🧠 02. Investigación In-Situ, Decisiones de UX y Análisis de Trade-offs

## 1. Reframing the Brief: De "Hacer una Plantilla" a Diseñar un Sistema

El proyecto nació a partir de un pedido puntual de la gerencia operativa de **Lubricantes Sur**:
> *"Necesitamos una plantilla más linda y fácil de usar para entregar a los clientes que piden presupuestos."*

Desde una mentalidad de **Product Design y Diseño de Servicios**, entregar únicamente una plantilla gráfica en Word o Canva habría sido un fracaso operativo: **el diseño visual seguía dependiendo de que 5 o 6 empleados distintos, atendiendo un local con altísima rotación presencial, copiaran, pegaran y sumaran números a mano en sus ratos libres.**

Como responsable también de la comunicación digital y redes sociales de la empresa, detecté que el problema de los presupuestos no era estético: **era una falla crítica de operaciones que estaba destruyendo reputación digital y margen comercial.**

---

## 2. Los 7 Dolores Detectados en la Investigación In-Situ

A través de la observación directa en el local, entrevistas con el dueño, la encargada y los empleados, y la auditoría de los presupuestos históricos y canales de WhatsApp/Google Maps, identifiqué 7 problemas estructurales:

### 1️⃣ Riesgo Inflacionario y Falta de Fechas de Validez
En el contexto económico de Argentina (alta inflación), los presupuestos hechos en Word muchas veces salían sin fecha o sin plazo de vigencia. Clientes regresaban semanas o meses después exigiendo el precio antiguo:
* Si el dueño respetaba el precio viejo para evitar un conflicto, **perdía dinero**.
* Si actualizaba el precio en el mostrador, el cliente sentía que lo estaban engañando, generando **malestar inmediato y desconfianza hacia la marca**.

### 2️⃣ Errores Humanos de Cálculo y Omisión de Ítems (Impacto directo en Google Reviews)
Al armar presupuestos a las apuradas entre cliente y cliente, eran frecuentes los errores al sumar totales o detallar filtros/aceites. Esto derivaba directamente en reseñas negativas de 1 estrella en Google Business Profile, anulando el esfuerzo de posicionamiento en redes sociales:

> ★☆☆☆☆ **Reseña real en Google Maps:**
> *"Un día fui por un presupuesto y me pasaron 108 mil con cambio de todos los filtros y aceite, le pedí turno para el otro día y cuando fui al otro día me quisieron cobrar 140 mil, se enojaron y me cobraron los 108 y no me cambiaron el filtro de nafta (ni me avisaron que no lo cambiaron)."*

### 3️⃣ Falta de Trazabilidad Interna (Accountability de Empleados)
Con 5 a 6 empleados rotando en la misma computadora, los documentos de Word no registraban quién los había confeccionado. Cuando ocurría un error de cotización, el dueño no sabía quién se había equivocado ni si se trataba de un error puntual o de un mal hábito sistemático, generando fricción interna en todo el equipo.

### 4️⃣ Ceguera Comercial y Contable
No existía ningún registro centralizado de cuánto dinero se presupuestaba por mes, cuántos presupuestos emitía cada empleado ni qué clientes recurrentes o empresas pedían cotizaciones periódicas.

### 5️⃣ Caos en la Nomenclatura y Archivo
Los archivos se guardaban con nombres arbitrarios, errores de ortografía o números aleatorios (por ejemplo, el archivo histórico real `PRESUPUEST0 MUUNI (1).docx`, escrito con un cero en lugar de la letra O y con importes tipeados con espacios manuales como `$4 8 000` o `TOTAL:$3 66 .000`).

### 6️⃣ Fricción en el "Último Eslabón" (Atención por WhatsApp)
Por falta de tiempo, los empleados enviaban el archivo adjunto por WhatsApp sin saludo, con textos cortantes o escritos íntegramente en MAYÚSCULAS. Un presupuesto técnicamente correcto podía perderse frente a la competencia por una experiencia de contacto fría o descuidada.

### 7️⃣ Ausencia de Segmentación (Cliente Particular vs. Flotas)
Se utilizaba el mismo documento improvisado para cotizar el cambio de aceite de un auto particular que para presupuestar múltiples unidades de una flota empresarial o municipal (`UNIDAD SALVEIRO DOMINIO: AB773KZ / AB773LA / AB773KY`).

---

## 3. Evidencia Real: Antes vs. Después

| Criterio | ❌ Antes (`PRESUPUEST0 MUUNI (1).docx`) | ✅ Después (`Presupuesto_P-2025-252.pdf`) |
| :--- | :--- | :--- |
| **Formato de salida** | Texto plano corrido en Word, sin tablas ni jerarquía visual, editable y alterable. | PDF A4 inmutable, maquetado originalmente en Adobe InDesign y automatizado vía Google Slides. |
| **Cálculo de importes** | Manual con calculadora (`$4 8 000`, `TOTAL:$3 66 .000`). Alto riesgo de error. | 100% automatizado en hoja `AUX` (`Cantidad × Unitario = Subtotal` y `TOTAL`). |
| **Trazabilidad** | Anónimo, sin numeración ni registro en base de datos. | Código único correlativo (`P-2025-252`), registro de operador (`Luci`) y timestamp. |
| **Vigencia comercial** | Inconsistente (a veces se olvidaban de escribirla). | Token `{{validez_dias}}` preconfigurado en `15 días` junto a fecha automática. |
| **Entrega por WhatsApp** | Manual, tono variable según el humor o apuro del empleado. | Botón directo `wa.me` con saludo cálido pre-armado y link público de Google Drive. |

---

## 4. Evaluación de Alternativas y Trade-offs ($0 Budget Constraint)

Para escalar más allá de 50–100 presupuestos mensuales sin generar costos de licencias para el dueño del negocio, evalué 4 arquitecturas posibles antes de construir la solución definitiva:

| Alternativa Evaluada | Complejidad | Escalabilidad | Estética del PDF | Control de Datos | Veredicto y Motivo de Decisión |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Opción A: Jotform + Sheets + Document Studio / AutoCrat** | 🟢 Baja | 🟡 Limitada por cuotas gratis | 🟢 Alta | 🟢 Buena | **Prototipado y superado:** Se probó inicialmente, pero los límites de cuota gratuita y la imposibilidad de personalizar la pantalla post-envío llevaron a reemplazar el add-on por código propio en Apps Script. |
| **Opción B: Fillout + Airtable / Notion + Make** | 🟡 Media | 🟢 Sí (Pago) | 🟡 Media | 🟢 Excelente | **Descartado:** Excelente como base de datos, pero los generadores de PDF externos y webhooks en Make requerían suscripciones mensuales al superar cierto volumen. |
| **Opción C: Glide App / Softr (No-Code App)** | 🟡 Media | 🟢 Sí (Pago) | 🟢 Alta | 🟢 Excelente | **Descartado:** Aunque ofrecía login por empleado, los planes gratuitos limitaban filas/usuarios y no justificaban un costo fijo mensual en esta etapa. |
| **Opción D: Desarrollo Web Custom (React + Backend)** | 🔴 Alta | 🟢 Total | 🟢 Total | 🟢 Total | **Descartado por sobre-ingeniería:** Reservado solo para un escenario futuro de +500 presupuestos/mes. |
| **✅ Solución Implementada: Landing HTML + Jotform CSS + Sheets (`AUX`) + Apps Script + Slides** | 🟡 Medium | 🟢 Ilimitada ($0) | 🟢 Editorial (InDesign → Slides) | 🟢 Total | **Seleccionada:** Costo operativo **$0/mes**, control absoluto de la UI de principio a fin, y generación de PDF + link de WhatsApp en menos de 1 minuto. |

---

## 5. Micro-Decisiones de UX que Marcaron la Diferencia

1. **Unificación Visual Cross-Platform (Coherencia Percibida):**
   Aunque el flujo atraviesa 3 tecnologías distintas (Landing HTML en Netlify → Formulario en Jotform → WebApp en Google Apps Script), el empleado percibe **una única aplicación nativa de Lubricantes Sur**. Se descartó usar constructores como *Carrd* para la landing inicial y se programó en HTML/CSS puro con las mismas fuentes (`Antonio` y `Fira Sans`), radios de borde (`20px`) y paleta (`#FFD500`, `#D70613`, `#000000`).
2. **Desplegable de Marcas con Escape Dinámico (`Marca` → `OTRA MARCA` → `MARCA FINAL`):**
   Para acelerar la carga desde el celular, el empleado elige entre las marcas más frecuentes del parque automotor local (Volkswagen, Peugeot, Ford, Renault, Toyota, Chevrolet, Fiat) en 1 toque. Si ingresa un vehículo atípico, elige `"Otra (especificar)"` y se despliega un campo condicional. Aunque esto genera 3 columnas en la hoja cruda de Jotform, la hoja `AUX` las colapsa silenciosamente en un único atributo `vehiculo_marca`.
3. **Separación entre Diagnóstico Público y Comentario Interno:**
   Los empleados necesitaban dejar advertencias operativas (por ejemplo, condiciones particulares del vehículo o acuerdos de palabra) que **no debían imprimirse en el PDF del cliente**, pero sí quedar registradas en la base de datos ante cualquier reclamo futuro. Se diseñó el campo `Comentario interno` con microcopy explícito: *"Información u observación interna no visible para los clientes (lo escrito acá no va al presupuesto)"*.
