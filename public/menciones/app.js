/*
 * Dashboard «quién nombra a quién» — dibujo e interacción, sin librerías.
 *
 * Los datos (window.DATOS_MENCIONES) los arma y valida congress-radar
 * (reports/dashboard_core.py): cifras, orden del círculo, vínculos, trayectorias y
 * de qué habla cada persona ya vienen calculados. Aquí solo se filtra lo visible y
 * se dibuja.
 *
 * Seguridad: todo texto que viene de los datos entra con textContent o como atributo
 * de un elemento creado a mano; nunca con innerHTML.
 */
(function () {
  'use strict';

  const DATOS = window.DATOS_MENCIONES;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CENTRO = 500;
  const RADIO = 350;               // deja margen a los rótulos radiales
  const HUECO_ENTRE_BLOQUES = 2;     // posiciones vacías entre bloques (como la figura)
  const ROTULOS_MAXIMOS = 12;        // nombres escritos; el resto vive en el tooltip
  const UMBRAL_POR_DEFECTO = 10;     // el de la figura publicada, si el período no trae el suyo
  const AVISO_COPIADO_MS = 2500;
  const DISTANCIA_ROTULO = 16;
  const SEPARACION_ANILLO = 3.5;     // px entre el nodo y el anillo de ruptura
  // Ancho de la línea por tramos de volumen: los de la figura publicada.
  const TRAMOS_ARISTA = [[20, 0.9], [40, 2.0], [80, 3.6], [Infinity, 6.0]];
  const CAMARAS = [
    { clave: 'ambas', nombre: 'Ambas' },
    { clave: 'senado', nombre: 'Senado' },
    { clave: 'diputados', nombre: 'Diputados' },
  ];
  const NOMBRE_CAMARA = { senado: 'Senado', diputados: 'Cámara de Diputados' };
  // Bajo este número de intervenciones de debate, los porcentajes de una persona se
  // mueven con muy pocos casos: el mismo piso por celda de las figuras de la casa
  // (MIN_INTERVENCIONES_TEMA en analysis/especializacion.py).
  const PISO_LECTURA_TEMAS = 30;

  const $ = (id) => document.getElementById(id);
  const estado = {
    // Se abre en el último período cerrado: el en curso tiene pocos meses y un grafo ralo
    // (decisión del 2026-09-27). Queda a un clic, y un enlace con #periodo= manda.
    periodo: (DATOS.periodos.filter((p) => !p.en_curso).pop() || DATOS.periodos[DATOS.periodos.length - 1]).nombre,
    camara: 'ambas',
    umbral: UMBRAL_POR_DEFECTO,
    // Mientras nadie mueva el control, el umbral sigue al período elegido (cada uno trae
    // el suyo: el en curso tiene pocas menciones y con 10+ se vería casi vacío).
    umbralManual: false,
    persona: null,
  };
  const porcentaje = (x) => (x === null || x === undefined ? '—' : `${Math.round(x * 100)}%`);
  const miles = (n) => n.toLocaleString('es-CL');

  function crear(etiqueta, atributos, padre) {
    const el = document.createElementNS(SVG_NS, etiqueta);
    for (const [k, v] of Object.entries(atributos || {})) el.setAttribute(k, v);
    if (padre) padre.appendChild(el);
    return el;
  }

  function periodoActual() {
    return DATOS.periodos.find((p) => p.nombre === estado.periodo);
  }

  // --- Estado en la URL: un enlace reproduce la vista (útil para citarla) ---------
  function leerHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    const periodo = params.get('periodo');
    if (periodo && DATOS.periodos.some((p) => p.nombre === periodo)) estado.periodo = periodo;
    const camara = params.get('camara');
    if (CAMARAS.some((c) => c.clave === camara)) estado.camara = camara;
    const umbral = parseInt(params.get('umbral'), 10);
    if (umbral >= 2 && umbral <= 40) {
      estado.umbral = umbral;
      estado.umbralManual = true;
    }
    const persona = params.get('persona');
    if (persona && DATOS.personas[persona]) estado.persona = persona;
  }

  function escribirHash() {
    const params = new URLSearchParams({
      periodo: estado.periodo, camara: estado.camara, umbral: String(estado.umbral),
    });
    if (estado.persona) params.set('persona', estado.persona);
    history.replaceState(null, '', `#${params.toString()}`);
  }

  // --- Qué se ve con los filtros vigentes ----------------------------------------
  function recibidasDe(nodo) {
    if (estado.camara === 'ambas') return nodo.recibidas;
    return nodo[`recibidas_${estado.camara}`];
  }

  function visibles(periodo) {
    const enCamara = (n) => estado.camara === 'ambas' || n.camara === estado.camara;
    const aristas = periodo.aristas.filter((a) => a.n >= estado.umbral
      && enCamara(periodo.nodos[a.a]) && enCamara(periodo.nodos[a.b]));
    const conArista = new Set();
    aristas.forEach((a) => { conArista.add(a.a); conArista.add(a.b); });
    const seguida = periodo.nodos.findIndex((n) => n.id === estado.persona);
    if (seguida >= 0 && enCamara(periodo.nodos[seguida])) conArista.add(seguida);
    const nodos = [...conArista].sort((x, y) => x - y);   // el orden del círculo
    return { nodos, aristas };
  }

  function posiciones(periodo, indices) {
    const bloques = new Set(indices.map((i) => periodo.nodos[i].bloque));
    const total = indices.length + HUECO_ENTRE_BLOQUES * bloques.size;
    const pos = new Map();
    let paso = 0;
    let previo = null;
    for (const i of indices) {
      const bloque = periodo.nodos[i].bloque;
      if (previo !== null && bloque !== previo) paso += HUECO_ENTRE_BLOQUES;
      const angulo = -Math.PI / 2 + (2 * Math.PI * paso) / Math.max(total, 1);
      pos.set(i, { x: CENTRO + RADIO * Math.cos(angulo), y: CENTRO + RADIO * Math.sin(angulo), angulo });
      paso += 1;
      previo = bloque;
    }
    return pos;
  }

  const anchoDe = (n) => TRAMOS_ARISTA.find(([tope]) => n < tope)[1];
  const radioDe = (recibidas) => 3 + 1.05 * Math.sqrt(Math.max(recibidas, 0));

  function forma(nodo, x, y, r, padre) {
    if (nodo.camara === 'diputados') {
      const d = r * 1.25;
      return crear('path', { d: `M${x} ${y - d}L${x + d} ${y}L${x} ${y + d}L${x - d} ${y}Z` }, padre);
    }
    return crear('circle', { cx: x, cy: y, r }, padre);
  }

  // --- Dibujo --------------------------------------------------------------------
  function dibujar() {
    const periodo = periodoActual();
    const colores = Object.fromEntries(periodo.bloques.map((b) => [b.nombre, b.color]));
    const { nodos, aristas } = visibles(periodo);
    const pos = posiciones(periodo, nodos);
    const capaAristas = $('capa-aristas');
    const capaNodos = $('capa-nodos');
    const capaRotulos = $('capa-rotulos');
    [capaAristas, capaNodos, capaRotulos].forEach((c) => c.replaceChildren());

    const orden = [...aristas].sort((a, b) => a.n - b.n);   // las gruesas encima
    for (const arista of orden) {
      const p = pos.get(arista.a);
      const q = pos.get(arista.b);
      const cruza = periodo.nodos[arista.a].bloque !== periodo.nodos[arista.b].bloque;
      const d = `M${p.x} ${p.y}Q${CENTRO} ${CENTRO} ${q.x} ${q.y}`;
      const linea = crear('path', {
        d, class: `arista ${cruza ? 'cruza' : 'dentro'}`, 'stroke-width': anchoDe(arista.n),
        'stroke-opacity': 0.55, 'data-a': arista.a, 'data-b': arista.b,
      }, capaAristas);
      const toque = crear('path', { d, class: 'arista-toque' }, capaAristas);
      toque.addEventListener('pointerenter', (ev) => {
        if (ev.pointerType !== 'touch') mostrarArista(ev, periodo, arista, linea);
      });
      toque.addEventListener('pointerleave', ocultarTooltip);
    }

    for (const i of nodos) {
      const nodo = periodo.nodos[i];
      const { x, y } = pos.get(i);
      const figura = forma(nodo, x, y, radioDe(recibidasDe(nodo)), capaNodos);
      figura.setAttribute('class', `nodo${nodo.id === estado.persona ? ' resaltado' : ''}`);
      if (nodo.ruptura) {
        // Anillo exterior, separado del nodo: se lee contra el fondo sea cual sea el color
        // del bloque, y no tapa el color (las cifras siguen en el bloque de su elección).
        const alcance = radioDe(recibidasDe(nodo)) * (nodo.camara === 'diputados' ? 1.25 : 1);
        crear('circle', { cx: x, cy: y, r: alcance + SEPARACION_ANILLO, class: 'anillo-ruptura', 'data-i': i }, capaNodos);
      }
      figura.setAttribute('fill', colores[nodo.bloque]);
      figura.setAttribute('data-i', i);
      const titulo = crear('title', {}, figura);
      titulo.textContent = `${nodo.nombre} (${nodo.bloque}${nodo.ruptura ? ', rompió con su pacto' : ''})`;
      // En pantalla táctil el «hover» y el toque llegan juntos: ahí solo vale el toque,
      // que abre el panel con la misma información que el tooltip.
      figura.addEventListener('pointerenter', (ev) => {
        if (ev.pointerType !== 'touch') mostrarNodo(ev, periodo, i);
      });
      figura.addEventListener('pointerleave', () => { ocultarTooltip(); quitarFoco(); });
      figura.addEventListener('click', () => seguir(nodo.id));
    }

    const rotulados = [...nodos].sort((a, b) => recibidasDe(periodo.nodos[b])
      - recibidasDe(periodo.nodos[a])).slice(0, ROTULOS_MAXIMOS);
    const seguida = nodos.find((i) => periodo.nodos[i].id === estado.persona);
    if (seguida !== undefined && !rotulados.includes(seguida)) rotulados.push(seguida);
    for (const i of rotulados) {
      const { angulo } = pos.get(i);
      const nodo = periodo.nodos[i];
      const r = RADIO + radioDe(recibidasDe(nodo)) + DISTANCIA_ROTULO;
      const x = CENTRO + r * Math.cos(angulo);
      const y = CENTRO + r * Math.sin(angulo);
      // Rótulo RADIAL: dos vecinos del círculo quedan en ángulos distintos y no se
      // enciman (horizontales, los más nombrados de un bloque se tapaban entre sí).
      // En la mitad izquierda se gira media vuelta para que no quede de cabeza.
      const grados = (angulo * 180) / Math.PI;
      const izquierda = Math.cos(angulo) < 0;
      const texto = crear('text', {
        x, y, class: `rotulo${i === seguida ? ' fuerte' : ''}`,
        'text-anchor': izquierda ? 'end' : 'start',
        'dominant-baseline': 'middle',
        transform: `rotate(${izquierda ? grados + 180 : grados} ${x} ${y})`,
      }, capaRotulos);
      texto.textContent = nodo.rotulo;
    }

    if (seguida !== undefined) enfocar(seguida);
    const aviso = $('aviso-vacio');
    aviso.hidden = nodos.length > 0;
    aviso.textContent = nodos.length ? '' : 'Ningún vínculo alcanza el umbral con este filtro. Baja el umbral o cambia de cámara.';
    escribirTitulos(periodo, nodos.length, aristas.length);
    escribirLeyenda(periodo);
    escribirTablaPeriodo(periodo);
  }

  // --- Resaltado y tooltip ---------------------------------------------------------
  function enfocar(i) {
    const vecinos = new Set([String(i)]);
    document.querySelectorAll('#capa-aristas .arista').forEach((l) => {
      const toca = l.dataset.a === String(i) || l.dataset.b === String(i);
      l.classList.toggle('atenuado', !toca);
      l.classList.toggle('resaltada', toca);
      if (toca) { vecinos.add(l.dataset.a); vecinos.add(l.dataset.b); }
    });
    document.querySelectorAll('#capa-nodos .nodo, #capa-nodos .anillo-ruptura').forEach((n) => {
      n.classList.toggle('atenuado', !vecinos.has(n.dataset.i));
    });
  }

  function quitarFoco() {
    document.querySelectorAll('.atenuado, .resaltada').forEach((el) => {
      el.classList.remove('atenuado', 'resaltada');
    });
    const periodo = periodoActual();
    const seguida = periodo.nodos.findIndex((n) => n.id === estado.persona);
    if (seguida >= 0 && document.querySelector(`#capa-nodos [data-i="${seguida}"]`)) enfocar(seguida);
  }

  function ubicarTooltip(ev) {
    const caja = $('grafo').parentElement.getBoundingClientRect();
    const tip = $('tooltip');
    tip.hidden = false;
    const x = Math.min(ev.clientX - caja.left + 14, caja.width - tip.offsetWidth - 4);
    const y = Math.min(ev.clientY - caja.top + 14, caja.height - tip.offsetHeight - 4);
    tip.style.left = `${Math.max(x, 4)}px`;
    tip.style.top = `${Math.max(y, 4)}px`;
  }

  function lineasTooltip(titulo, lineas) {
    const tip = $('tooltip');
    tip.replaceChildren();
    const fuerte = document.createElement('strong');
    fuerte.textContent = titulo;
    tip.appendChild(fuerte);
    for (const texto of lineas) {
      const div = document.createElement('div');
      div.textContent = texto;
      tip.appendChild(div);
    }
  }

  function mostrarNodo(ev, periodo, i) {
    const n = periodo.nodos[i];
    const recibidas = recibidasDe(n);
    const otros = estado.camara === 'ambas' ? n.recibidas_otros : n[`recibidas_otros_${estado.camara}`];
    const quien = { ambas: '', senado: ' por senadores', diputados: ' por diputados' }[estado.camara];
    lineasTooltip(n.nombre, [
      `${NOMBRE_CAMARA[n.camara] || n.camara} · ${n.bloque}${n.partido ? ` · ${n.partido}` : ''}`,
      `Nombrada ${miles(recibidas)} veces${quien}${recibidas ? `, ${porcentaje(otros / recibidas)} desde otros bloques` : ''}`,
      `Nombra ${miles(n.hechas)} veces`,
      ...(n.ruptura ? [`Rompe con su pacto (${n.ruptura.fecha}): ${n.ruptura.hacia}`] : []),
      ...(n.agenda && n.agenda.temas.length ? [`Habla sobre todo de: ${DATOS.temas[n.agenda.temas[0][0]]}`] : []),
      'Clic: seguir en todos los períodos',
    ]);
    ubicarTooltip(ev);
    enfocar(i);
  }

  function mostrarArista(ev, periodo, arista, linea) {
    const a = periodo.nodos[arista.a];
    const b = periodo.nodos[arista.b];
    lineasTooltip(`${a.rotulo} ↔ ${b.rotulo}: ${miles(arista.n)} menciones`, [
      `${a.nombre} nombra a ${b.rotulo} ${miles(arista.n_ab)} veces`,
      `${b.nombre} nombra a ${a.rotulo} ${miles(arista.n_ba)} veces`,
    ]);
    ubicarTooltip(ev);
    linea.classList.add('resaltada');
    ev.target.addEventListener('pointerleave', () => linea.classList.remove('resaltada'), { once: true });
  }

  function ocultarTooltip() { $('tooltip').hidden = true; }

  // --- Textos que dependen del filtro ---------------------------------------------
  function escribirTitulos(periodo, nPersonas, nVinculos) {
    const cifras = periodo.cifras[estado.camara];
    const donde = { ambas: 'en la sala', senado: 'entre senadores', diputados: 'entre diputados' }[estado.camara];
    $('titulo').textContent = cifras.cruza === null
      ? `Sin menciones ${donde} en ${periodo.etiqueta}`
      : `El ${porcentaje(cifras.cruza)} de las menciones ${donde} cruza la línea entre bloques; al azar cruzaría el ${porcentaje(cifras.esperado)}`;
    const enCurso = periodo.en_curso ? ` (período en curso, datos hasta el ${periodo.fecha_max})` : '';
    $('subtitulo').textContent = `Quién nombra a quién, ${periodo.etiqueta}${enCurso}: ${miles(cifras.menciones)} menciones «senador/diputado X» con emisor y destino identificados. Se dibujan ${miles(nVinculos)} vínculos con ${estado.umbral}+ menciones (${miles(nPersonas)} personas); el tamaño es cuántas veces se nombra a cada una.`;
    $('fuente').textContent = periodo.fuente || DATOS.fuente;
    $('cobertura').textContent = periodo.resueltas === null || periodo.resueltas === undefined ? ''
      : `Cobertura del período: el ${porcentaje(periodo.resueltas)} de las menciones detectadas se resolvió contra la nómina; el resto (apellidos ambiguos, erratas del Diario o del OCR) queda fuera del grafo.`;
    const avisos = $('avisos');
    avisos.replaceChildren();
    for (const texto of periodo.avisos || []) {
      const li = document.createElement('li');
      li.textContent = texto;
      avisos.appendChild(li);
    }
    avisos.hidden = !(periodo.avisos && periodo.avisos.length);
    $('lectura-designados').hidden = !periodo.bloques.some((b) => b.nombre === 'Designados');
    document.title = `Quién nombra a quién, ${periodo.etiqueta} — ${DATOS.marca}`;
  }

  function escribirLeyenda(periodo) {
    $('leyenda-ruptura').hidden = !periodo.nodos.some((n) => n.ruptura);
    const ul = $('leyenda');
    ul.replaceChildren();
    for (const bloque of periodo.bloques) {
      const li = document.createElement('li');
      const punto = document.createElement('span');
      punto.className = 'punto';
      punto.style.background = bloque.color;
      li.append(punto, bloque.etiqueta || bloque.nombre);
      ul.appendChild(li);
    }
  }

  function celda(fila, texto, numerica) {
    const td = document.createElement('td');
    td.textContent = texto;
    if (numerica) td.className = 'num';
    fila.appendChild(td);
    return td;
  }

  function escribirTablaPeriodo(periodo) {
    const cuerpo = $('tabla-periodo').tBodies[0];
    cuerpo.replaceChildren();
    $('th-nombrada').textContent = { ambas: 'Nombrada', senado: 'Nombrada por senadores', diputados: 'Nombrada por diputados' }[estado.camara];
    const enCamara = (n) => estado.camara === 'ambas' || n.camara === estado.camara;
    const filas = periodo.nodos.filter(enCamara).sort((a, b) => recibidasDe(b) - recibidasDe(a)).slice(0, 25);
    for (const n of filas) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'enlace';
      boton.textContent = n.nombre;
      boton.addEventListener('click', () => seguir(n.id));
      td.appendChild(boton);
      tr.appendChild(td);
      celda(tr, NOMBRE_CAMARA[n.camara] || n.camara);
      celda(tr, n.bloque);
      const recibidas = recibidasDe(n);
      const otros = estado.camara === 'ambas' ? n.recibidas_otros : n[`recibidas_otros_${estado.camara}`];
      celda(tr, miles(recibidas), true);
      celda(tr, recibidas ? porcentaje(otros / recibidas) : '—', true);
      celda(tr, miles(n.hechas), true);
      cuerpo.appendChild(tr);
    }
  }

  // --- Trayectoria de una persona -------------------------------------------------
  function trayectoria(id) {
    return DATOS.periodos.map((p) => ({ periodo: p, nodo: p.nodos.find((n) => n.id === id) || null }));
  }

  function escribirPanel() {
    const persona = estado.persona && DATOS.personas[estado.persona];
    $('panel-vacio').hidden = Boolean(persona);
    $('panel-persona').hidden = !persona;
    $('limpiar').hidden = !persona;
    if (!persona) return;
    $('persona-nombre').textContent = persona.nombre;
    const nPeriodos = persona.periodos.length;
    $('persona-nota').textContent = `Aparece en ${nPeriodos} de ${DATOS.periodos.length} períodos con menciones.`
      + (persona.llave === 'nombre'
        ? ' Seguimiento por nombre: no tiene Reseña Parlamentaria de la BCN enlazada, así que un cambio en cómo se escribe su nombre puede separar períodos.'
        : '');
    const filas = trayectoria(estado.persona);
    escribirRupturas(filas);
    const cuerpo = $('persona-tabla').tBodies[0];
    cuerpo.replaceChildren();
    for (const { periodo, nodo } of filas) {
      const tr = document.createElement('tr');
      if (periodo.nombre === estado.periodo) tr.className = 'actual';
      if (!nodo) tr.classList.add('ausente');
      const td = document.createElement('td');
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'enlace';
      boton.textContent = periodo.etiqueta;
      boton.addEventListener('click', () => elegirPeriodo(periodo.nombre));
      td.appendChild(boton);
      tr.appendChild(td);
      if (!nodo) {
        const vacio = celda(tr, 'no aparece');
        vacio.colSpan = 5;
      } else {
        celda(tr, NOMBRE_CAMARA[nodo.camara] || nodo.camara);
        const bloque = celda(tr, nodo.bloque);
        if (nodo.ruptura) {
          // El mismo círculo punteado de la leyenda: el texto largo desbordaba la columna.
          const marca = document.createElement('span');
          marca.textContent = ' ◌';
          marca.title = 'Rompió con su pacto durante el período';
          marca.setAttribute('aria-label', 'rompió con su pacto durante el período');
          bloque.appendChild(marca);
        }
        celda(tr, miles(nodo.recibidas), true);
        celda(tr, nodo.recibidas ? porcentaje(nodo.recibidas_otros / nodo.recibidas) : '—', true);
        celda(tr, miles(nodo.hechas), true);
      }
      cuerpo.appendChild(tr);
    }
    dibujarBarras(filas);
    escribirTemas(filas);
  }

  // Una línea por período en que la persona rompió con su pacto, con su fuente.
  function escribirRupturas(filas) {
    const ul = $('persona-rupturas');
    ul.replaceChildren();
    const conRuptura = filas.filter(({ nodo }) => nodo && nodo.ruptura);
    ul.hidden = conRuptura.length === 0;
    for (const { periodo, nodo } of conRuptura) {
      const li = document.createElement('li');
      li.append(`${periodo.etiqueta}: ${nodo.ruptura.resumen} `);
      const enlace = document.createElement('a');
      enlace.href = nodo.ruptura.fuente;
      enlace.target = '_blank';
      enlace.rel = 'noopener noreferrer';
      enlace.textContent = 'Fuente';
      li.appendChild(enlace);
      ul.appendChild(li);
    }
  }

  // De qué habla la persona en el período elegido: hasta cinco temas de debate, con la
  // parte de SU agenda que ocupa cada uno. Se redibuja con el período (escribirPanel corre
  // en cada actualizar), así que no tiene estado propio.
  function escribirTemas(filas) {
    const fila = filas.find((f) => f.periodo.nombre === estado.periodo);
    const lista = $('persona-temas-lista');
    const nota = $('persona-temas-nota');
    lista.replaceChildren();
    if (!fila) return;
    const { periodo, nodo } = fila;
    $('persona-temas-titulo').textContent = `De qué habla en ${periodo.etiqueta}`;
    // `agenda` ausente (data.js anterior al contrato v2) se lee como «sin temas».
    const agenda = nodo ? nodo.agenda : null;
    let aviso = '';
    if (!periodo.con_temas || (nodo && !agenda)) aviso = 'Este período no tiene clasificación temática.';
    else if (!nodo) aviso = 'No aparece en este período.';
    else if (agenda.n === 0) aviso = 'No registra intervenciones como parlamentaria en este período.';
    lista.hidden = Boolean(aviso);
    if (aviso) {
      nota.textContent = aviso;
      return;
    }
    for (const [indice, n] of agenda.temas) {
      const tema = DATOS.temas[indice];
      const parte = n / agenda.n;
      const li = document.createElement('li');
      const nombre = document.createElement('span');
      nombre.className = 'tema-nombre';
      nombre.textContent = tema;
      const cifra = document.createElement('span');
      cifra.className = 'tema-cifra';
      cifra.textContent = `${porcentaje(parte)} (${miles(n)})`;
      const pista = document.createElement('span');
      pista.className = 'tema-pista';
      pista.setAttribute('aria-hidden', 'true');
      const barra = document.createElement('span');
      barra.className = 'tema-barra';
      // CSSOM, no atributo style: lo permite la CSP (style-src 'self'), como el tooltip.
      barra.style.width = `${Math.max(parte * 100, 1)}%`;
      pista.appendChild(barra);
      li.append(nombre, cifra, pista);
      li.setAttribute('aria-label', `${tema}: ${porcentaje(parte)} de su agenda, ${miles(n)} intervenciones`);
      lista.appendChild(li);
    }
    const debate = agenda.n - agenda.sala;
    nota.textContent = `Porcentaje de sus ${miles(agenda.n)} intervenciones del período; entre paréntesis, cuántas son del tema.`
      + (agenda.sala ? ` ${porcentaje(agenda.sala / agenda.n)} fue trámite de sala (organizar la sesión, reglamento) y no se lista.` : '')
      + (agenda.temas.length === 0 ? ' Ninguna intervención de debate con tema asignado.' : '')
      + (debate > 0 && debate < PISO_LECTURA_TEMAS ? ' Pocas intervenciones de debate: lee los porcentajes con cautela.' : '');
  }

  function dibujarBarras(filas) {
    const svg = $('persona-barras');
    svg.replaceChildren();
    const ancho = 340;
    const alto = 150;
    const base = alto - 22;
    svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
    const maximo = Math.max(1, ...filas.map((f) => (f.nodo ? f.nodo.recibidas : 0)));
    const paso = ancho / filas.length;
    filas.forEach(({ periodo, nodo }, k) => {
      const valor = nodo ? nodo.recibidas : 0;
      const h = ((base - 18) * valor) / maximo;
      const x = k * paso + paso * 0.18;
      crear('rect', {
        x, y: base - h, width: paso * 0.64, height: Math.max(h, nodo ? 1 : 0),
        class: `barra${periodo.nombre === estado.periodo ? ' actual' : ''}`,
      }, svg);
      if (nodo) {
        const v = crear('text', { x: x + paso * 0.32, y: base - h - 4, 'text-anchor': 'middle', class: 'valor' }, svg);
        v.textContent = miles(valor);
      }
      const t = crear('text', { x: x + paso * 0.32, y: alto - 6, 'text-anchor': 'middle' }, svg);
      t.textContent = periodo.nombre.slice(2, 4) + '–' + periodo.nombre.slice(7, 9);
    });
    svg.setAttribute('aria-label', 'Veces que fue nombrada por período: ' + filas
      .map(({ periodo, nodo }) => `${periodo.etiqueta} ${nodo ? nodo.recibidas : 'no aparece'}`).join('; '));
  }

  function elegirPeriodo(nombre) {
    estado.periodo = nombre;
    if (!estado.umbralManual) estado.umbral = umbralDelPeriodo();
    actualizar();
  }

  function umbralDelPeriodo() {
    const periodo = periodoActual();
    return (periodo && periodo.umbral_inicial) || UMBRAL_POR_DEFECTO;
  }

  // --- Compartir: la URL ya guarda la vista; el botón solo la copia ------------------
  async function copiarEnlace() {
    const aviso = $('copiado');
    try {
      await navigator.clipboard.writeText(location.href);
      aviso.textContent = 'Enlace copiado';
    } catch (error) {
      // Sin permiso de portapapeles (p. ej. abierto desde el disco): se escribe la URL
      // junto al botón para copiarla a mano, en vez de fallar en silencio.
      console.warn('No se pudo copiar el enlace:', error);
      aviso.textContent = location.href;
      return;
    }
    setTimeout(() => { aviso.textContent = ''; }, AVISO_COPIADO_MS);
  }

  function seguir(id) {
    estado.persona = id;
    $('buscar').value = id ? DATOS.personas[id].nombre : '';
    actualizar();
  }

  // --- Controles ------------------------------------------------------------------
  function botonesRadio(contenedor, opciones, activa, alElegir) {
    contenedor.replaceChildren();
    for (const op of opciones) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(op.clave === activa));
      b.textContent = op.nombre;
      if (op.titulo) b.title = op.titulo;
      b.addEventListener('click', () => alElegir(op.clave));
      contenedor.appendChild(b);
    }
  }

  function escribirControles() {
    botonesRadio($('periodos'), DATOS.periodos.map((p) => ({
      clave: p.nombre, nombre: p.etiqueta,
      titulo: `${miles(p.cifras.ambas.menciones)} menciones`,
    })), estado.periodo, (clave) => elegirPeriodo(clave));
    botonesRadio($('camaras'), CAMARAS, estado.camara, (clave) => { estado.camara = clave; actualizar(); });
    $('umbral').value = estado.umbral;
    $('umbral-valor').textContent = estado.umbral;
  }

  function llenarBuscador() {
    const lista = $('personas');
    const etiquetas = new Map();
    for (const [id, p] of Object.entries(DATOS.personas)) {
      // Dos personas con el mismo nombre se distinguen por sus períodos.
      const etiqueta = etiquetas.has(p.nombre) ? `${p.nombre} (${p.periodos.join(', ')})` : p.nombre;
      etiquetas.set(etiqueta, id);
      const opcion = document.createElement('option');
      opcion.value = etiqueta;
      lista.appendChild(opcion);
    }
    const elegir = () => {
      const id = etiquetas.get($('buscar').value.trim());
      if (id) seguir(id);
    };
    $('buscar').addEventListener('change', elegir);
    $('buscar').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') elegir(); });
    $('limpiar').addEventListener('click', () => seguir(null));
  }

  function actualizar() {
    escribirControles();
    dibujar();
    escribirPanel();
    escribirHash();
  }

  function iniciar() {
    if (!DATOS || !DATOS.periodos || !DATOS.periodos.length) {
      $('titulo').textContent = 'No se pudieron cargar los datos';
      return;
    }
    $('lectura').textContent = DATOS.lectura.charAt(0).toUpperCase() + DATOS.lectura.slice(1);
    leerHash();
    if (!estado.umbralManual) estado.umbral = umbralDelPeriodo();
    llenarBuscador();
    $('copiar').addEventListener('click', copiarEnlace);
    if (estado.persona) $('buscar').value = DATOS.personas[estado.persona].nombre;
    $('umbral').addEventListener('input', (ev) => {
      estado.umbral = parseInt(ev.target.value, 10);
      estado.umbralManual = true;
      actualizar();
    });
    window.addEventListener('hashchange', () => { leerHash(); actualizar(); });
    actualizar();
  }

  iniciar();
}());
