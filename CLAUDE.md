# CLAUDE.md — landing

Ficha de proyecto (molde §12 de la raíz, versión mínima: este repo es un solo
`index.html`). **Este repo es público** — se ve en `iniciativapolimetro.github.io` y
cualquiera puede leer su historial de git. No entra aquí estrategia de negocio,
precios ni información interna: eso vive en los repos privados del emprendimiento.

## Meta
Página pública de la marca Polimetro.

## Estado
**en producción** — `2026-08-15` — publicada en `https://iniciativapolimetro.github.io`.
Contenido pendiente de realinear al pivote a political intelligence (ver Backlog).

## MVP hecho cuando:
- [x] Página publicada y accesible en la URL pública
- [ ] Contenido alineado con el negocio actual (political intelligence, no el rubro
      anterior)

## Cómo se usa
- **Instalar:** nada que instalar — es un `index.html` estático.
- **Correr:** abrir `index.html` en un navegador para ver cambios localmente.
- **Testear:** revisión manual en el navegador antes de hacer push (no hay tests
  automatizados; declarado explícito, no es una omisión).
- **Publicar:** ver `README.md` (dato canónico; no se repite aquí).

## Stack y entorno
HTML/CSS/JS en un único archivo (`index.html`, ~478 KB). Sin build, sin dependencias
de paquetes declaradas.

## Licencias de terceros
Sin registrar todavía — `index.html` puede traer librerías o assets embebidos
(fuentes, íconos, JS) sin auditar. Pendiente antes de comercializar cualquier cosa
que dependa de esta página (§11 raíz).

| Componente | Versión | Licencia | Uso comercial | Origen |
|---|---|---|---|---|
| _(vacío — pendiente auditar `index.html`)_ | | | | |

## Deuda de licencia
Vacío = bien, pero sin verificar (ver Licencias de terceros).

## Decisiones (vigentes)
_(sin decisiones de arquitectura registradas todavía)_

## Backlog
- Realinear el contenido de la página al pivote (political intelligence, no el rubro
  anterior).
- Auditar `index.html` en busca de librerías o assets de terceros embebidos, para
  completar la tabla de licencias.

## Cierre de sesión
Antes de cerrar una sesión de trabajo aquí: agregar una entrada (1-3 líneas) al inicio
de `BITACORA.md` (`AAAA-MM-DD` — qué se hizo. Pendiente: qué quedó) y actualizar
`## Estado` solo si cambió. Detalle del protocolo → `../CLAUDE.md` (fuera de este
repo, en el espacio de trabajo local).
