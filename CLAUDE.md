# CLAUDE.md — landing

Ficha de proyecto (molde §12 de la raíz). **Este repo es público**: se ve en
`https://iniciativapolimetro.github.io` y cualquiera puede leer sus archivos y su
historial de git. No entra aquí estrategia de negocio, precios, datos de clientes ni
información interna; eso vive en los repos privados del emprendimiento. Los commits se
firman con el correo de la marca (config local de este repo), nunca con uno personal.

## Meta
La página pública de Iniciativa Polímetro: que quien llega desde LinkedIn, el newsletter
o una recomendación entienda qué hacemos (inteligencia del ecosistema político chileno),
vea evidencia real (el dashboard del Congreso) y tenga cómo escribirnos.

## Estado
**en producción** — `2026-09-26` — reescrita entera: HTML semántico sin JS, en la
cianotipia de la marca, con el dashboard «Quién nombra a quién» en `/menciones/`. Se
publica solo `public/` con GitHub Actions.
**Siguiente paso:** probar en un celular real; enlazar el dashboard desde el newsletter.

## MVP hecho cuando:
- [x] La página pública se abre en la URL y se lee completa sin JavaScript
- [x] Dice qué hacemos en el rubro actual (political intelligence), sin prometer predicción
- [x] Enlaza a evidencia real: el dashboard `/menciones/` y el newsletter
- [x] Tiene un canal de contacto funcionando (mailto al correo de la marca)
- [ ] Probada en un celular real después de publicada

## Cómo se usa
- **Instalar:** nada. Sitio estático, sin build ni dependencias.
- **Correr (ver en local):** `python -m http.server 8765 --bind 127.0.0.1 --directory public`
  y abrir `http://127.0.0.1:8765/`.
- **Testear:** manual antes de cada push: escritorio y 375 px, sin scroll horizontal, los
  enlaces entre `/` y `/menciones/`, la landing legible sin JavaScript, consola sin
  errores; después del push, la visita aparece en Google Analytics → Informes → Tiempo real (la política de seguridad de contenido bloquea cualquier recurso externo). Lo
  testeable en código (tokens, fuentes, contrato del dashboard) se testea en el generador
  (repo privado congress-radar).
- **Regenerar lo generado** (desde congress-radar): `radar brand-css --destino
  ../landing/public` y `radar mentions-dashboard --periodos <los diez> --destino
  ../landing/public/menciones`.
- **Publicar:** push a `main` con cambios en `public/` → el flujo
  `.github/workflows/pages.yml` publica en unos minutos. Ver `README.md`.

## Stack y entorno
HTML + CSS a mano; el dashboard trae su propio JS, sin librerías. GitHub Pages con fuente
«GitHub Actions» (no desde la raíz del repo), para que la documentación interna no quede
servida como página.

```
public/                     ← lo único que se publica
  index.html                  landing (a mano)
  404.html                    página de error (a mano)
  robots.txt, sitemap.xml
  assets/brand/               GENERADO por `radar brand-css`: tokens.css, base.css,
                              favicon.svg, fonts/ (woff2 + licencias OFL)
  assets/css/home.css         estilos propios de la landing (a mano, sin colores escritos)
  assets/js/analytics.js      Google Analytics 4 (a mano; lo cargan landing, 404 y dashboard)
  assets/img/og.jpg           imagen para compartir enlaces
  menciones/                  GENERADO por `radar mentions-dashboard`
.github/workflows/pages.yml   despliegue; acciones fijadas por hash
```

**Seguridad del sitio:** cada página declara una política de seguridad de contenido
(`Content-Security-Policy` en `<meta>`: recursos del propio sitio más los dominios de
Google Analytics, ningún script en línea) y `referrer` estricto; sin formularios. Lo
generado publica solo agregados de parlamentarios (personas públicas): ni citas ni rutas.

**Medición:** Google Analytics 4, ID `G-HH0W14NTWF` (propiedad creada en abril de 2026, en
la cuenta de la marca). Mide visitas por página (`/` y `/menciones/`) y su origen. Sin
Google Signals ni señales de publicidad; retención de 2 meses (ajuste hecho en la consola
de GA). Solo se activa en el dominio público. **Usa cookies**: ver el pendiente de la ley
21.719 en el Backlog. Aviso visible en el pie de cada página.

## Licencias de terceros
| Componente | Versión | Licencia | Uso comercial | Origen |
|---|---|---|---|---|
| Tipografía Lato (400, 400 itálica, 700) | v25, subconjunto latino | SIL OFL 1.1 (`assets/brand/fonts/OFL-Lato.txt`) | Sí | fonts.gstatic.com / github.com/google/fonts |
| Tipografía Playfair Display (600) | v40, subconjunto latino | SIL OFL 1.1 | Sí | ídem |
| Tipografía IBM Plex Mono (500) | v20, subconjunto latino | SIL OFL 1.1 | Sí | ídem |
| Google Analytics 4 (servicio, `gtag.js` cargado desde Google) | — | Términos de servicio de Google Analytics (no es código que se distribuya) | Sí | analytics.google.com |
| GitHub Actions: checkout, configure-pages, upload-pages-artifact, deploy-pages | fijadas por hash en el flujo | MIT | Sí (corren en GitHub, no se distribuyen) | github.com/actions |
| `og.jpg` (recorte del banner del kit de marca) | — | propio | Sí | kit de marca |
| Dashboard `menciones/` | — | propio | Sí | `radar mentions-dashboard` |

## Deuda de licencia
Vacío = bien.

## Decisiones (vigentes)
Índice: una línea por decisión. La entrada completa vive en `decisiones-detalle.md`.

- `2026-09-26` — Landing reescrita a mano (HTML/CSS sin build ni JS), en la cianotipia
  oscura de la marca, conservando la forma de trabajo de la versión anterior.
- `2026-09-26` — La marca web (`assets/brand/`) se genera desde congress-radar; fuentes
  alojadas en el repo, sin Google Fonts.
- `2026-09-26` — Un solo llamado a la acción: «Escríbenos» (mailto). Sin botón a GitHub.
- `2026-09-26` — Se publica solo `public/` con GitHub Actions; nombres de archivo del sitio
  en inglés (`assets/`, `styles.css`), URL pública en español (`/menciones/`).
- `2026-09-26` — Commits firmados con el correo de la marca; el correo personal se borró
  del historial de este repo (reescritura con OK explícito del usuario).
- `2026-09-26` — Visitas medidas con Google Analytics 4 (ID de abril), sin Signals ni
  publicidad, activo solo en el dominio público; configuración en archivo propio (CSP sin
  scripts en línea).
- `2026-09-26` — Cabecera y pie se repiten a mano en cada página; se reevalúa con cuatro o
  más páginas.

## Backlog
- **Antes del 1 de diciembre de 2026** (entrada en vigencia de la ley 21.719 de datos
  personales): revisar si Google Analytics exige consentimiento previo y, si es así,
  agregar un aviso de cookies o activar el «modo de consentimiento» de Google. Revisión
  humana/legal: esto no es asesoría legal.
- Probar en un celular real y con lector de pantalla.
- Enlaces a Substack y LinkedIn como llamados a la acción, si hace falta.
- Tema claro (hoy solo oscuro: la paleta está validada sobre la superficie oscura).
- Más páginas de evidencia (figuras del newsletter, metodología propia en el sitio).
- Favicon derivado del logo del kit de marca.
- `menciones/data.js` pesa 2 MB y cada regeneración suma a la historia; si molesta,
  recortar el contrato o regenerar con menos frecuencia.

## Cierre de sesión
Antes de cerrar una sesión aquí: una entrada (1-3 líneas) al inicio de `BITACORA.md`
(`AAAA-MM-DD` — qué se hizo. Pendiente: qué quedó) y actualizar `## Estado` solo si
cambió. Detalle del protocolo → `../CLAUDE.md`.
