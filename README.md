# iniciativapolimetro.github.io

Sitio público de Iniciativa Polímetro: `https://iniciativapolimetro.github.io`.

## Estructura

- `public/` — **lo único que se publica.**
  - `index.html`, `404.html`, `robots.txt`, `sitemap.xml`
  - `assets/css/home.css`, `assets/img/og.jpg` — propios de la landing, a mano.
  - `assets/brand/` — tokens de color, base CSS, favicon y fuentes. **Generado**; no se
    edita aquí.
  - `menciones/` — el dashboard «Quién nombra a quién en el Congreso». **Generado**; no se
    edita aquí.
- `.github/workflows/pages.yml` — despliegue a GitHub Pages.
- `CLAUDE.md`, `BITACORA.md`, `decisiones-detalle.md` — documentación del proyecto (no
  se publica como página).

## Ver en local

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory public
```

## Publicar

Push a `main` con cambios en `public/`: GitHub Actions publica solo esa carpeta en unos
minutos. No hay build.
