# Decisiones — texto completo (landing)

Índice en `CLAUDE.md`. Lo más nuevo arriba. Las superadas se marcan y se mueven a
`decisiones-archivo.md` (§7 de la raíz: marcar, nunca borrar).

`2026-09-26` — **Las visitas se miden con Google Analytics 4 (el ID `G-HH0W14NTWF`, creado
en abril), con la configuración en un archivo propio y activo solo en el dominio público.**

**Por qué.** El usuario quiere saber cuántos visitan la landing y cuántos llegan al
dashboard, y de dónde vienen (LinkedIn, newsletter). Ya tenía la cuenta y la propiedad.

**Cómo.** `public/assets/js/analytics.js` (sin script en línea, así la CSP no necesita
`'unsafe-inline'`); la CSP permite solo los dominios de Google que GA4 usa. Sin Google
Signals ni señales de publicidad; retención de 2 meses. Aviso en el pie. Se reusa el ID de
abril: conserva los datos anteriores.

**Descartado (recomendación de Claude, que el usuario no tomó):** Cloudflare Web
Analytics u otro servicio sin cookies, que evitaba el aviso de consentimiento. **Riesgo
declarado:** la ley 21.719 entra en vigencia el 1-12-2026; hay que revisar el
consentimiento antes de esa fecha (Backlog).

`2026-09-26` — **Orden de nivel industria y seguridad: se publica solo `public/` con GitHub
Actions, con nombres de archivo del sitio en inglés, política de seguridad de contenido en
cada página, y commits firmados con el correo de la marca.**

**Por qué.** Con Pages sirviendo la raíz del repo, `CLAUDE.md`, la bitácora y este archivo
quedaban servidos como páginas del sitio. Los nombres de los archivos publicados mezclaban
español e inglés. GitHub Pages no permite cabeceras HTTP propias. Y tres commits de agosto
estaban firmados con un correo personal, visible para cualquiera en el historial.

**Qué se decidió.**
- `public/` con `index.html`, `404.html`, `robots.txt`, `sitemap.xml` y `assets/{brand,css,img}`;
  el dashboard en `public/menciones/` con `styles.css` y `data.js`. La URL pública se queda
  en español (`/menciones/`): es contenido para lectores en español, no un identificador.
- Despliegue por GitHub Actions (`pages.yml`): solo `public/`, permisos mínimos, acciones
  fijadas por hash de commit, `timeout`.
- `Content-Security-Policy` y `referrer` en `<meta>`: solo recursos del propio sitio. La
  landing no ejecuta JavaScript; el dashboard solo sus dos scripts.
- Commits firmados con el correo de la marca (config local del repo). El historial se
  reescribió para reemplazar el correo personal de los tres commits de agosto, con OK
  explícito del usuario, y se subió con force push.

**Descartado.** Publicar desde `/docs` (nombre confuso para un sitio y deja la raíz del
repo mezclada); mover la documentación a otro repo (la ficha debe vivir junto al proyecto,
§6 de la raíz); dejar el correo personal en el historial.

`2026-09-26` — **La landing se reescribe a mano en la cianotipia de la marca, con el
dashboard del Congreso como subpágina y la marca web generada desde congress-radar.**

**Por qué.** La landing anterior se hizo en abril-agosto de 2026, antes de dos cambios:
el cambio de rubro a political intelligence y la adopción de la cianotipia como
identidad visual (2026-09-08, en las figuras). Tenía tres problemas de fondo:
- **No era HTML editable.** Era un bundle exportado de un artifact: 478 KB, el contenido
  dentro de un string JSON y 21 fuentes en base64. Sin JavaScript no se veía nada y los
  buscadores casi no leían el texto. No se podía corregir, solo reemplazar.
- **Hablaba de otro negocio** («productos de ciencia de datos para instituciones»), sin
  mencionar política ni el Congreso.
- **Tenía otra identidad** (navy sobre claro, IBM Plex Sans) que las figuras, el kit de
  marca y el dashboard.

**Qué se decidió (con el usuario).**
- Meta: credibilidad ante quien evalúa trabajar con nosotros. Se conserva la **forma de trabajo** de la
  versión anterior (la pregunta correcta, las tres formas de empezar, las cuatro etapas
  con salida, «estamos empezando»); los textos se reescriben más humanos y en el rubro.
- «Qué hacemos» mantiene Diagnóstico → Prototipo → Operación, con ejemplos políticos y
  una regla explícita: no se promete predicción.
- Construcción: HTML/CSS a mano, sin generador ni build, sin JS en la landing (§10 de la
  raíz: cero dependencias que puedan romperse).
- Tema: cianotipia oscura en todo el sitio.
- La marca web (`marca/`) la genera `radar brand-css` desde `lib/publish.py`: una sola
  fuente de verdad del cromo para figuras, dashboard y landing.
- Fuentes alojadas en el repo (Lato, Playfair Display, IBM Plex Mono; SIL OFL): la visita
  no llama a Google.
- Un solo llamado a la acción: «Escríbenos» (mailto al correo público de la marca). El
  newsletter aparece como evidencia, no como botón. Se quita el botón a GitHub (los repos
  son privados; llevaba a una cuenta casi vacía).
- Sección nueva «Lo que ya existe»: el dashboard y el newsletter como evidencia.

**Descartado.**
- Parchar el bundle: no es editable.
- Generador estático (Astro, Eleventy): suma Node, dependencias y build para dos páginas.
- Tema claro con acentos de cianotipia: la paleta solo está validada sobre la superficie
  oscura; dos superficies = dos validaciones.
- CSS de marca escrito a mano en la landing: se desalinea de `publish.py` (ya pasó con el
  CSS del dashboard).
- Google Fonts por CDN: privacidad del visitante y dependencia de un tercero.
- Cabecera y pie inyectados por JS: con dos páginas, repetirlos es más simple, indexable
  y funciona sin JS. Se reevalúa con cuatro o más páginas.
