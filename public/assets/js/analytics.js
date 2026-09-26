/*
 * Google Analytics 4: cuenta visitas por página y de dónde llegan (landing y dashboard).
 *
 * Va en un archivo propio y no incrustado en el HTML para que la política de seguridad de
 * contenido (CSP) no tenga que permitir scripts en línea. Solo se activa en el dominio
 * público: las pruebas en local no cuentan como visitas. Sin Google Signals ni señales de
 * publicidad (decisión del 2026-09-26; ver CLAUDE.md).
 */
(function () {
  'use strict';

  var ID_MEDICION = 'G-HH0W14NTWF';
  var DOMINIO_PUBLICO = 'iniciativapolimetro.github.io';

  if (location.hostname !== DOMINIO_PUBLICO) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', ID_MEDICION, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID_MEDICION;
  document.head.appendChild(script);
}());
