/* Taller de geometría: trazar figuras 2D, construir el cubo (con caras o dibujándolo),
   reconocer sus partes y practicar reflexión y traslación sobre una cuadrícula. */
(function () {
  "use strict";
  var C = Comun, esc = C.esc;
  var app = document.getElementById("app");
  var CLAVE = "geo-progreso";
  var G = C.leer(CLAVE, {}) || {};
  if (!G.hecho) G.hecho = {};
  function salvar() { C.guardar(CLAVE, G); }
  function marcar(k) { G.hecho[k] = true; salvar(); }
  function $(id) { return document.getElementById(id); }
  function decir(t) { C.hablar(t); }
  function azar(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  var limpieza = null;
  function alSalir(fn) { var prev = limpieza; limpieza = function () { if (prev) prev(); fn(); }; }
  function pantalla(titulo, atras, html) {
    if (limpieza) { limpieza(); limpieza = null; }
    C.callar();
    app.innerHTML = '<header class="barra"><button class="hbtn' + (atras ? "" : " oculto") + '" id="g-atras" aria-label="Volver">⬅️</button>' +
      '<h1>' + esc(titulo) + '</h1><button class="hbtn" id="g-voz" aria-label="Voz"></button></header><main class="zona">' + html + '</main>';
    if (atras) $("g-atras").onclick = function () { atras(); };
    var v = $("g-voz");
    var pv = function () { v.textContent = C.vozEncendida() ? "🔊" : "🔇"; };
    pv(); v.onclick = function () { C.alternarVoz(); pv(); };
    window.scrollTo(0, 0);
  }
  function caja(id, html, tipo) { $(id).innerHTML = html ? '<div class="caja ' + (tipo || "aviso") + '">' + html + '</div>' : ""; }

  /* ===== Geometría plana ===== */
  function k(p) { return p[0] + "," + p[1]; }
  function igual(a, b) { return a[0] === b[0] && a[1] === b[1]; }
  function resta(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function cruz(a, b) { return a[0] * b[1] - a[1] * b[0]; }
  function pto(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  function len2(a) { return a[0] * a[0] + a[1] * a[1]; }

  /* Quita vértices que están en medio de una línea recta. */
  function limpiar(pts) {
    var p = pts.slice(), cambio = true;
    while (cambio && p.length > 2) {
      cambio = false;
      for (var i = 0; i < p.length; i++) {
        var a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length];
        if (cruz(resta(b, a), resta(c, b)) === 0) { p.splice(i, 1); cambio = true; break; }
      }
    }
    return p;
  }
  function sobre(a, b, c) {
    return Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);
  }
  function seCruzan(p1, p2, p3, p4) {
    var d1 = cruz(resta(p4, p3), resta(p1, p3)), d2 = cruz(resta(p4, p3), resta(p2, p3));
    var d3 = cruz(resta(p2, p1), resta(p3, p1)), d4 = cruz(resta(p2, p1), resta(p4, p1));
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
    return (d1 === 0 && sobre(p3, p4, p1)) || (d2 === 0 && sobre(p3, p4, p2)) || (d3 === 0 && sobre(p1, p2, p3)) || (d4 === 0 && sobre(p1, p2, p4));
  }
  function simple(p) {
    var n = p.length;
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (seCruzan(p[i], p[(i + 1) % n], p[j], p[(j + 1) % n])) return false;
    }
    return true;
  }
  var NOMBRES = { 5: "pentágono", 6: "hexágono", 7: "heptágono", 8: "octágono" };

  /* Reconoce la figura trazada. */
  function reconocer(pts) {
    var p = limpiar(pts), n = p.length;
    if (n < 3) return { tipo: "nada" };
    if (!simple(p)) return { tipo: "cruzada" };
    var v = p.map(function (a, i) { return resta(p[(i + 1) % n], a); });
    var L = v.map(len2);
    var rectos = v.map(function (a, i) { return pto(a, v[(i + 1) % n]) === 0; });
    var r = { lados: n, vertices: n, p: p };
    if (n === 3) {
      var rect = rectos.some(Boolean), iso = L[0] === L[1] || L[1] === L[2] || L[0] === L[2];
      r.tipo = "triangulo";
      r.nombre = "un triángulo" + (rect ? " rectángulo" : iso ? " isósceles" : "");
      r.info = "Tiene 3 lados y 3 vértices." + (rect ? " Además, tiene un ángulo recto." : "");
    } else if (n === 4) {
      var iguales = L.every(function (x) { return x === L[0]; }), todos = rectos.every(Boolean);
      var par1 = cruz(v[0], v[2]) === 0, par2 = cruz(v[1], v[3]) === 0;
      if (iguales && todos) { r.tipo = "cuadrado"; r.nombre = "un cuadrado"; r.info = "Tiene 4 lados iguales, 4 vértices y 4 ángulos rectos."; }
      else if (todos) { r.tipo = "rectangulo"; r.nombre = "un rectángulo"; r.info = "Tiene 4 lados, 4 vértices y 4 ángulos rectos. Sus lados opuestos miden lo mismo."; }
      else if (iguales) { r.tipo = "rombo"; r.nombre = "un rombo"; r.info = "Tiene 4 lados iguales y 4 vértices."; }
      else if (par1 && par2) { r.tipo = "paralelogramo"; r.nombre = "un paralelogramo"; r.info = "Tiene 4 lados, y sus lados opuestos son paralelos."; }
      else if (par1 || par2) { r.tipo = "trapecio"; r.nombre = "un trapecio"; r.info = "Tiene 4 lados, y dos de ellos son paralelos."; }
      else { r.tipo = "cuadrilatero"; r.nombre = "un cuadrilátero"; r.info = "Tiene 4 lados y 4 vértices."; }
    } else {
      r.tipo = "poligono";
      r.nombre = NOMBRES[n] ? "un " + NOMBRES[n] : "un polígono de " + n + " lados";
      r.info = "Tiene " + n + " lados y " + n + " vértices.";
    }
    r.derecho = v.every(function (d) { return d[0] === 0 || d[1] === 0; });
    if (r.tipo === "cuadrado") r.lado = Math.round(Math.sqrt(L[0]));
    return r;
  }

  /* ===== Dibujo en SVG ===== */
  function cuadricula(cols, filas) {
    var h = '<rect x="-0.6" y="-0.6" width="' + (cols + 1.2) + '" height="' + (filas + 1.2) + '" fill="#fff"/><g stroke="#dfe7f2" stroke-width="0.04">';
    for (var x = 0; x <= cols; x++) h += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + filas + '"/>';
    for (var y = 0; y <= filas; y++) h += '<line x1="0" y1="' + y + '" x2="' + cols + '" y2="' + y + '"/>';
    h += '</g><g fill="#b8c4d6">';
    for (x = 0; x <= cols; x++) for (y = 0; y <= filas; y++) h += '<circle cx="' + x + '" cy="' + y + '" r="0.07"/>';
    return h + '</g>';
  }
  function aUnidades(svg, x, y) {
    var pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
    var r = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [r.x, r.y];
  }
  /* Lienzo con cuadrícula; avisa el punto de la cuadrícula tocado. */
  function lienzo(el, cols, filas, alTocar) {
    el.innerHTML = '<svg viewBox="-0.6 -0.6 ' + (cols + 1.2) + ' ' + (filas + 1.2) + '"></svg>';
    var svg = el.firstChild, base = cuadricula(cols, filas);
    if (alTocar) svg.addEventListener("click", function (e) {
      var p = aUnidades(svg, e.clientX, e.clientY), q = [Math.round(p[0]), Math.round(p[1])];
      if (q[0] < 0 || q[1] < 0 || q[0] > cols || q[1] > filas) return;
      if (Math.abs(p[0] - q[0]) > 0.45 || Math.abs(p[1] - q[1]) > 0.45) return;
      alTocar(q);
    });
    return { svg: svg, pintar: function (h) { svg.innerHTML = base + h; } };
  }
  function poli(pts, cerrado, o) {
    o = o || {};
    if (!pts.length) return "";
    var d = pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ");
    var trazo = o.trazo || "#2b2b3a", grosor = o.grosor || 0.1, guion = o.guion ? ' stroke-dasharray="' + o.guion + '"' : "";
    if (cerrado) return '<polygon points="' + d + '" fill="' + (o.relleno || "none") + '" stroke="' + trazo + '" stroke-width="' + grosor + '" stroke-linejoin="round"' + guion + '/>';
    return '<polyline points="' + d + '" fill="none" stroke="' + trazo + '" stroke-width="' + grosor + '" stroke-linecap="round" stroke-linejoin="round"' + guion + '/>';
  }
  function linea(a, b, color, grosor, guion) {
    return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="' + color + '" stroke-width="' + (grosor || 0.1) +
      '" stroke-linecap="round"' + (guion ? ' stroke-dasharray="' + guion + '"' : "") + '/>';
  }
  function puntos(pts, color, r) {
    return pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (r || 0.2) + '" fill="' + color + '" stroke="#fff" stroke-width="0.05"/>'; }).join("");
  }

  /* Herramienta para trazar un polígono tocando puntos. */
  function trazador(el, cols, filas, o) {
    var st = { pts: [], cerrado: false };
    var lz = lienzo(el, cols, filas, tocar);
    var color = o.color || "#6b6bd6";
    function tocar(p) {
      if (st.cerrado || o.bloqueado && o.bloqueado()) return;
      if (st.pts.length >= 3 && igual(p, st.pts[0])) { st.cerrado = true; pintar(); o.alCerrar(st.pts.slice()); return; }
      if (st.pts.some(function (q) { return igual(q, p); })) { if (o.aviso) o.aviso("Ese punto ya lo usaste. Para cerrar la figura, toca el primer punto."); return; }
      st.pts.push(p); pintar(); if (o.alCambiar) o.alCambiar();
    }
    function pintar() {
      var h = o.fondo ? o.fondo() : "";
      h += poli(st.pts, st.cerrado, { relleno: st.cerrado ? color + "55" : "none", trazo: color });
      if (!st.cerrado && st.pts.length >= 3) h += '<circle cx="' + st.pts[0][0] + '" cy="' + st.pts[0][1] + '" r="0.4" fill="none" stroke="' + color + '" stroke-width="0.07" class="pulso"/>';
      h += puntos(st.pts, color);
      if (o.encima) h += o.encima();
      lz.pintar(h);
    }
    pintar();
    return {
      st: st, pintar: pintar,
      deshacer: function () { if (st.cerrado) st.cerrado = false; else st.pts.pop(); pintar(); if (o.alCambiar) o.alCambiar(); },
      borrar: function () { st.pts = []; st.cerrado = false; pintar(); if (o.alCambiar) o.alCambiar(); }
    };
  }

  /* ===== Inicio ===== */
  function inicio() {
    var h = G.hecho;
    var etapas = [
      ["trazar", "✏️", "1. Trazar figuras", "Une puntos y forma figuras 2D", "#ffe1ec", h.trazar, function () { etapaTrazar(0); }],
      ["cubo", "🧊", "2. Construir el cubo", "Ármalo con caras o dibújalo", "#e6e8ff", h.caras || h.dibujo, etapaCubo],
      ["partes", "🔍", "3. Partes del cubo", "Caras, aristas y vértices", "#dff5e7", h.partes, etapaPartes],
      ["mov", "🪞", "4. Movimientos", "Reflexión y traslación", "#fff0c2", h.reflexion && h.traslacion, function () { etapaMov("reflexion"); }]
    ];
    pantalla("Taller de geometría", function () { location.href = "../"; },
      '<div class="intro"><div style="font-size:52px">📐</div><b>Construye y descubre figuras</b><br><small>Sigue el camino paso a paso</small></div>' +
      '<div class="menu">' + etapas.map(function (e) {
        return '<button class="mbtn" style="background:' + e[4] + '" data-e="' + e[0] + '"><span class="ic">' + e[1] + '</span><span>' + e[2] +
          '<small>' + e[3] + '</small></span>' + (e[5] ? '<span class="listo">✅</span>' : "") + '</button>';
      }).join("") + '</div><p class="nota">Toca 🔊 arriba para prender o apagar la voz.</p>');
    etapas.forEach(function (e) { app.querySelector('[data-e="' + e[0] + '"]').onclick = e[6]; });
  }

  /* ===== 1. Trazar figuras ===== */
  var MISIONES = [
    { tipo: "triangulo", t: "Triángulo", dibuja: "un triángulo" },
    { tipo: "cuadrado", t: "Cuadrado", dibuja: "un cuadrado" },
    { tipo: "rectangulo", t: "Rectángulo", dibuja: "un rectángulo" },
    { tipo: "libre", t: "Libre", dibuja: "la figura que quieras" }
  ];
  function etapaTrazar(m) {
    var mi = MISIONES[m];
    pantalla("1. Trazar figuras", inicio,
      '<div class="chips">' + MISIONES.map(function (x, i) { return '<button class="chip' + (i === m ? " activa" : "") + '" data-m="' + i + '">' + x.t + '</button>'; }).join("") + '</div>' +
      '<div class="caja info"><b>Misión: dibuja ' + mi.dibuja + '.</b><br>Toca los puntos de la cuadrícula para poner los vértices. Para cerrar la figura, toca el primer punto.</div>' +
      '<div class="lienzo" id="t-lienzo"></div>' +
      '<div class="herr"><button class="btn suave" id="t-deshacer">↩️ Deshacer</button><button class="btn suave" id="t-borrar">🧽 Borrar</button></div>' +
      '<div id="t-res"></div>');
    Array.prototype.forEach.call(app.querySelectorAll("[data-m]"), function (b) { b.onclick = function () { etapaTrazar(+b.getAttribute("data-m")); }; });
    var tz = trazador($("t-lienzo"), 10, 10, {
      aviso: function (t) { caja("t-res", t); },
      alCambiar: function () { $("t-res").innerHTML = ""; },
      alCerrar: function (pts) {
        var r = reconocer(pts), h;
        if (r.tipo === "cruzada" || r.tipo === "nada") {
          h = '<div class="fb bad"><b>Las líneas se cruzan o no forman una figura.</b><br>Toca Deshacer y prueba otro camino.</div>';
          $("t-res").innerHTML = h; decir("Las líneas se cruzan. Toca deshacer y prueba otro camino."); return;
        }
        var minx = Math.min.apply(null, r.p.map(function (a) { return a[0]; })), miny = Math.min.apply(null, r.p.map(function (a) { return a[1]; }));
        G.figura = r.p.map(function (a) { return [a[0] - minx, a[1] - miny]; });
        if (r.tipo === "cuadrado" && r.derecho && r.lado >= 2 && r.lado <= 4) G.cuadrado = { lado: r.lado };
        salvar();
        var ok = mi.tipo === "libre" || r.tipo === mi.tipo;
        var cuenta = '<div class="cuenta"><span>Lados: ' + r.lados + '</span><span>Vértices: ' + r.vertices + '</span></div>';
        if (ok) {
          marcar("trazar");
          h = '<div class="fb ok"><b>¡Muy bien! Dibujaste ' + r.nombre + '. 🎉</b><br>' + r.info + cuenta + '</div>';
          decir("¡Muy bien! Dibujaste " + r.nombre + ". " + r.info);
        } else if (mi.tipo === "rectangulo" && r.tipo === "cuadrado") {
          h = '<div class="fb bad"><b>¡Eso es un cuadrado!</b><br>Para un rectángulo, haz dos lados más largos que los otros dos.</div>';
          decir("Eso es un cuadrado. Para un rectángulo, haz dos lados más largos que los otros dos.");
        } else {
          h = '<div class="fb bad"><b>Dibujaste ' + r.nombre + '.</b><br>La misión era dibujar ' + mi.dibuja + '. ¡Inténtalo otra vez!' + cuenta + '</div>';
          decir("Dibujaste " + r.nombre + ". La misión era dibujar " + mi.dibuja + ".");
        }
        if (r.tipo === "cuadrado") {
          if (r.derecho && r.lado >= 2 && r.lado <= 4) h += '<button class="btn" id="t-cubo">🧊 Construir un cubo con este cuadrado</button>';
          else if (r.derecho) h += '<div class="caja aviso">Para construir el cubo, usa un cuadrado de 2 a 4 cuadritos por lado.</div>';
          else h += '<div class="caja aviso">Para construir el cubo, dibuja el cuadrado derecho, con lados horizontales y verticales.</div>';
        }
        if (ok && m < MISIONES.length - 1) h += '<button class="btn alt" id="t-sig">Siguiente misión ➡️</button>';
        h += '<button class="btn suave" id="t-otra">✏️ Dibujar otra</button>';
        $("t-res").innerHTML = h;
        if ($("t-cubo")) $("t-cubo").onclick = etapaCubo;
        if ($("t-sig")) $("t-sig").onclick = function () { etapaTrazar(m + 1); };
        $("t-otra").onclick = tz.borrar;
      }
    });
    $("t-deshacer").onclick = tz.deshacer;
    $("t-borrar").onclick = tz.borrar;
    decir("Misión: dibuja " + mi.dibuja + ". Toca los puntos para poner los vértices.");
  }

  /* ===== 2. Construir el cubo ===== */
  function lado() { return (G.cuadrado && G.cuadrado.lado) || 3; }
  function etapaCubo() {
    pantalla("2. Construir el cubo", inicio,
      '<div class="intro"><div style="font-size:48px">🧊</div><b>¿Cómo quieres construir tu cubo?</b><br><small>' +
      (G.cuadrado ? "Usaremos tu cuadrado de " + lado() + " cuadritos por lado." : "Usaremos un cuadrado de 3 cuadritos por lado.") + '</small></div>' +
      '<div class="menu">' +
      '<button class="mbtn" style="background:#e6e8ff" id="c-caras"><span class="ic">🧩</span><span>Armarlo con caras<small>Junta 6 caras y dóblalas</small></span>' + (G.hecho.caras ? '<span class="listo">✅</span>' : "") + '</button>' +
      '<button class="mbtn" style="background:#ffe1ec" id="c-dibujo"><span class="ic">✏️</span><span>Dibujarlo<small>En perspectiva, como en el cuaderno</small></span>' + (G.hecho.dibujo ? '<span class="listo">✅</span>' : "") + '</button>' +
      '</div>' + (G.cuadrado ? "" : '<p class="nota">Si dibujas un cuadrado en "Trazar figuras", el cubo usará ese cuadrado.</p>'));
    $("c-caras").onclick = function () { etapaCaras(); };
    $("c-dibujo").onclick = etapaDibujo;
    decir("¿Cómo quieres construir tu cubo? Puedes armarlo con caras o dibujarlo.");
  }
  function otroCamino(actual) {
    var otro = actual === "caras" ? "dibujo" : "caras";
    if (G.hecho[otro]) return "";
    return '<button class="btn suave" id="x-otro">' + (otro === "caras" ? "🧩 Ahora ármalo con caras" : "✏️ Ahora dibújalo") + '</button>';
  }
  function bindOtroCamino(actual) {
    var b = $("x-otro");
    if (b) b.onclick = actual === "caras" ? etapaDibujo : function () { etapaCaras(); };
  }

  /* --- 2A. Armar con caras (desarrollo del cubo) --- */
  var NC = 9, NF = 7, BASE = [4, 3];
  var COLORES = ["#ff7a59", "#8ecae6", "#ffd166", "#95d5b2", "#cdb4db", "#f4a261"];
  var EJEMPLO = [[4, 3], [3, 3], [5, 3], [4, 2], [4, 4], [4, 5]];
  function vecino(c, lista) { return lista.some(function (x) { return Math.abs(x[0] - c[0]) + Math.abs(x[1] - c[1]) === 1; }); }
  function conectado(lista) {
    if (!lista.length) return true;
    var vistos = [lista[0]], cola = [lista[0]];
    while (cola.length) {
      var a = cola.shift();
      lista.forEach(function (b) {
        if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1 && vistos.indexOf(b) < 0) { vistos.push(b); cola.push(b); }
      });
    }
    return vistos.length === lista.length;
  }
  function etapaCaras(previas) {
    var cs = previas ? previas.slice() : [BASE.slice()];
    pantalla("Armar con caras", etapaCubo,
      '<div class="caja info">Junta <b>6 caras</b> para armar el cubo. <b>Arrastra</b> la cara azul o <b>toca</b> un cuadrito junto a otra cara. La cara naranja es tu cuadrado.</div>' +
      '<div class="lienzo" id="n-lienzo"></div>' +
      '<div class="bandeja"><div class="pieza" id="n-pieza" title="Arrastra esta cara"></div><div><b id="n-cuenta"></b><br><small>Toca una cara para quitarla.</small></div></div>' +
      '<div id="n-msj"></div>' +
      '<button class="btn" id="n-doblar" disabled>📦 Doblar</button>' +
      '<div class="fila"><button class="btn suave" id="n-borrar">🧽 Empezar de nuevo</button><button class="btn suave" id="n-ayuda">💡 Ver un ejemplo</button></div>');
    var el = $("n-lienzo");
    el.innerHTML = '<svg viewBox="-0.2 -0.2 ' + (NC + 0.4) + ' ' + (NF + 0.4) + '"></svg>';
    var svg = el.firstChild;
    function idx(c) { for (var i = 0; i < cs.length; i++) if (igual(cs[i], c)) return i; return -1; }
    function msj(t, tipo) { caja("n-msj", t, tipo); }
    function pintar() {
      var h = '<rect x="-0.2" y="-0.2" width="' + (NC + 0.4) + '" height="' + (NF + 0.4) + '" fill="#fff"/>';
      for (var x = 0; x < NC; x++) for (var y = 0; y < NF; y++) {
        var c = [x, y], libre = idx(c) < 0, sugerida = libre && cs.length < 6 && vecino(c, cs);
        h += '<rect x="' + (x + 0.04) + '" y="' + (y + 0.04) + '" width="0.92" height="0.92" rx="0.06" fill="' + (sugerida ? "#fff4d6" : "#f6f8fb") +
          '" stroke="' + (sugerida ? "#e8a317" : "#e3e9f2") + '" stroke-width="0.03"' + (sugerida ? ' stroke-dasharray="0.08 0.06"' : "") + '/>';
      }
      cs.forEach(function (c, i) {
        h += '<rect x="' + c[0] + '" y="' + c[1] + '" width="1" height="1" fill="' + (i === 0 ? COLORES[0] : "#8ecae6") + '" stroke="#2b2b3a" stroke-width="0.05"/>';
      });
      svg.innerHTML = h;
      $("n-cuenta").textContent = "Caras: " + cs.length + " de 6";
      $("n-doblar").disabled = cs.length !== 6;
    }
    function celda(x, y) {
      var r = svg.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
      var p = aUnidades(svg, x, y), c = [Math.floor(p[0]), Math.floor(p[1])];
      return (c[0] < 0 || c[1] < 0 || c[0] >= NC || c[1] >= NF) ? null : c;
    }
    function agregar(c) {
      if (idx(c) >= 0) return;
      if (cs.length >= 6) { msj("Ya tienes las 6 caras. Toca <b>Doblar</b>."); return; }
      if (!vecino(c, cs)) { msj("Las caras deben tocarse por un lado."); decir("Las caras deben tocarse por un lado."); return; }
      cs.push(c); msj(""); pintar();
      if (cs.length === 6) { msj("¡Ya tienes las 6 caras! Toca <b>Doblar</b> para ver si se cierra el cubo.", "ok"); decir("¡Ya tienes 6 caras! Toca doblar."); }
    }
    function quitar(i) {
      if (i === 0) { msj("Esa es tu cuadrado, la base del cubo. No se puede quitar."); return; }
      var r = cs.filter(function (_, j) { return j !== i; });
      if (!conectado(r)) { msj("Si quitas esa cara, otras quedarían sueltas."); return; }
      cs = r; msj(""); pintar();
    }
    svg.addEventListener("click", function (e) {
      var c = celda(e.clientX, e.clientY); if (!c) return;
      var i = idx(c); if (i >= 0) quitar(i); else agregar(c);
    });
    $("n-pieza").addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var f = document.createElement("div"); f.className = "pieza fantasma"; document.body.appendChild(f);
      function mover(ev) { f.style.left = (ev.clientX - 28) + "px"; f.style.top = (ev.clientY - 28) + "px"; }
      function fin(ev) {
        window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", fin); window.removeEventListener("pointercancel", fin);
        f.remove();
        if (ev.type === "pointerup") { var c = celda(ev.clientX, ev.clientY); if (c) agregar(c); }
      }
      mover(e);
      window.addEventListener("pointermove", mover); window.addEventListener("pointerup", fin); window.addEventListener("pointercancel", fin);
    });
    alSalir(function () { Array.prototype.forEach.call(document.querySelectorAll(".fantasma"), function (x) { x.remove(); }); });
    $("n-doblar").onclick = function () { etapaDoblar(cs); };
    $("n-borrar").onclick = function () { cs = [BASE.slice()]; msj(""); pintar(); };
    $("n-ayuda").onclick = function () { cs = EJEMPLO.map(function (c) { return c.slice(); }); pintar(); msj("Este es un ejemplo. ¡Hay 11 formas distintas de armar un cubo! Prueba también las tuyas.", "info"); };
    pintar();
    decir("Junta seis caras para armar el cubo. Arrastra la cara azul o toca un cuadrito junto a otra cara.");
  }

  /* --- Matemática 3D --- */
  var ID = { m: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], t: [0, 0, 0] };
  function mulM(a, b) { return a.map(function (r) { return [0, 1, 2].map(function (j) { return r[0] * b[0][j] + r[1] * b[1][j] + r[2] * b[2][j]; }); }); }
  function mulV(m, v) { return m.map(function (r) { return r[0] * v[0] + r[1] * v[1] + r[2] * v[2]; }); }
  function aplicar(A, p) { var q = mulV(A.m, p); return [q[0] + A.t[0], q[1] + A.t[1], q[2] + A.t[2]]; }
  function componer(A, B) { var q = mulV(A.m, B.t); return { m: mulM(A.m, B.m), t: [q[0] + A.t[0], q[1] + A.t[1], q[2] + A.t[2]] }; }
  function rotarEje(a, u, ang) {
    var c = Math.cos(ang), s = Math.sin(ang), c1 = 1 - c, x = u[0], y = u[1], z = u[2];
    var m = [[c + x * x * c1, x * y * c1 - z * s, x * z * c1 + y * s], [y * x * c1 + z * s, c + y * y * c1, y * z * c1 - x * s], [z * x * c1 - y * s, z * y * c1 + x * s, c + z * z * c1]];
    var ra = mulV(m, a);
    return { m: m, t: [a[0] - ra[0], a[1] - ra[1], a[2] - ra[2]] };
  }
  /* Coordenadas planas: x = columna, y = -fila, z = 0. */
  function esquinas(c) { return [[c[0], -c[1], 0], [c[0] + 1, -c[1], 0], [c[0] + 1, -c[1] - 1, 0], [c[0], -c[1] - 1, 0]]; }
  function arbol(cs) {
    var caras = cs.map(function (c, i) { return { c: c, i: i, padre: -1 }; });
    var orden = [0], visto = [true];
    for (var q = 0; q < orden.length; q++) {
      var P = caras[orden[q]], p = P.c;
      caras.forEach(function (F) {
        if (visto[F.i] || Math.abs(F.c[0] - p[0]) + Math.abs(F.c[1] - p[1]) !== 1) return;
        visto[F.i] = true; orden.push(F.i); F.padre = P.i;
        var dx = F.c[0] - p[0], dy = F.c[1] - p[1], b;
        if (dx === 1) b = [[p[0] + 1, -p[1], 0], [p[0] + 1, -p[1] - 1, 0]];
        else if (dx === -1) b = [[p[0], -p[1], 0], [p[0], -p[1] - 1, 0]];
        else if (dy === 1) b = [[p[0], -p[1] - 1, 0], [p[0] + 1, -p[1] - 1, 0]];
        else b = [[p[0], -p[1], 0], [p[0] + 1, -p[1], 0]];
        F.a = b[0];
        var u = [b[1][0] - b[0][0], b[1][1] - b[0][1], 0];
        F.u = u;
        var centro = [F.c[0] + 0.5, -F.c[1] - 0.5, 0];
        F.signo = aplicar(rotarEje(F.a, F.u, Math.PI / 2), centro)[2] > 0 ? 1 : -1;
      });
    }
    return { caras: caras, orden: orden };
  }
  function plegar(ar, t) {
    var T = [];
    ar.orden.forEach(function (i) {
      var F = ar.caras[i];
      T[i] = F.padre < 0 ? ID : componer(T[F.padre], rotarEje(F.a, F.u, F.signo * t * Math.PI / 2));
    });
    return ar.caras.map(function (F) { return esquinas(F.c).map(function (p) { return aplicar(T[F.i], p); }); });
  }
  function cierraBien(ar) {
    var vistos = {};
    plegar(ar, 1).forEach(function (q) {
      var c = [0, 1, 2].map(function (j) { return String(Math.round((q[0][j] + q[1][j] + q[2][j] + q[3][j]) * 25)); }).join(",");
      vistos[c] = true;
    });
    return Object.keys(vistos).length === 6;
  }
  function vistaPlegado(p, centro, yaw, pitch) {
    var x = p[0] - centro[0], y = p[1] - centro[1], z = p[2] - centro[2];
    var x1 = x * Math.cos(yaw) - y * Math.sin(yaw), y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
    var y2 = y1 * Math.cos(pitch) - z * Math.sin(pitch), z2 = y1 * Math.sin(pitch) + z * Math.cos(pitch);
    return [x1, -y2, z2];
  }
  /* Permite girar arrastrando. alTocar recibe el elemento tocado (si no hubo arrastre). */
  function girable(svg, vista, alCambiar, alTocar) {
    svg.addEventListener("pointerdown", function (e) {
      var x0 = e.clientX, y0 = e.clientY, yaw0 = vista.yaw, pitch0 = vista.pitch, movio = false;
      function mover(ev) {
        var dx = ev.clientX - x0, dy = ev.clientY - y0;
        if (!movio && Math.abs(dx) + Math.abs(dy) < 8) return;
        movio = true;
        vista.yaw = yaw0 + dx * 0.012;
        vista.pitch = Math.max(-1.45, Math.min(1.45, pitch0 + dy * 0.012));
        alCambiar();
      }
      function fin(ev) {
        window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", fin); window.removeEventListener("pointercancel", fin);
        if (!movio && ev.type === "pointerup" && alTocar) alTocar(document.elementFromPoint(ev.clientX, ev.clientY));
      }
      window.addEventListener("pointermove", mover); window.addEventListener("pointerup", fin); window.addEventListener("pointercancel", fin);
    });
  }

  /* --- Animación del doblado --- */
  function etapaDoblar(cs) {
    var ar = arbol(cs), valido = cierraBien(ar);
    pantalla("Doblar el cubo", function () { etapaCaras(cs); },
      '<div class="caja info">Mira cómo se doblan las caras… Después puedes <b>girarlo con el dedo</b>.</div>' +
      '<div class="lienzo girar" id="d3-lienzo"><svg viewBox="-3.2 -3.2 6.4 6.4"></svg></div>' +
      '<div id="d3-res"></div>');
    var svg = $("d3-lienzo").firstChild, vista = { yaw: 0.35, pitch: -0.95 }, t = 0, raf = 0;
    function pintar() {
      var Q = plegar(ar, t), todos = [];
      Q.forEach(function (q) { todos = todos.concat(q); });
      var centro = [0, 1, 2].map(function (j) { return todos.reduce(function (s, p) { return s + p[j]; }, 0) / todos.length; });
      var caras = Q.map(function (q, i) {
        var pr = q.map(function (p) { return vistaPlegado(p, centro, vista.yaw, vista.pitch); });
        return { i: i, pr: pr, z: pr.reduce(function (s, p) { return s + p[2]; }, 0) / 4 };
      }).sort(function (a, b) { return a.z - b.z; });
      var mitad = 3.2 * (1 - t) + 1.25 * t;
      svg.setAttribute("viewBox", (-mitad) + " " + (-mitad) + " " + (2 * mitad) + " " + (2 * mitad));
      svg.innerHTML = caras.map(function (c) {
        return '<polygon points="' + c.pr.map(function (p) { return p[0].toFixed(3) + "," + p[1].toFixed(3); }).join(" ") +
          '" fill="' + COLORES[c.i] + '" fill-opacity="0.92" stroke="#2b2b3a" stroke-width="' + (0.05 * mitad / 3.2 + 0.015) + '" stroke-linejoin="round"/>';
      }).join("");
    }
    function animar() {
      var ini = null;
      cancelAnimationFrame(raf);
      function paso(ts) {
        if (ini === null) ini = ts;
        var x = Math.min(1, (ts - ini) / 2600);
        t = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
        pintar();
        if (x < 1) raf = requestAnimationFrame(paso); else terminar();
      }
      raf = requestAnimationFrame(paso);
    }
    function terminar() {
      var h;
      if (valido) {
        marcar("caras");
        h = '<div class="fb ok"><b>¡Se cerró el cubo! 🎉</b><br>Con 6 caras cuadradas armaste un cuerpo geométrico 3D.</div>' +
          '<button class="btn" id="d3-partes">🔍 Ver sus partes</button>' + otroCamino("caras");
        decir("¡Se cerró el cubo! Con seis caras cuadradas armaste un cuerpo geométrico.");
      } else {
        h = '<div class="fb bad"><b>Ups, no se cerró.</b><br>Dos caras quedaron una encima de otra y el cubo quedó abierto por un lado. ¡Prueba con otra forma!</div>';
        decir("Ups, no se cerró. Dos caras quedaron una encima de otra. Prueba con otra forma.");
      }
      h += '<div class="fila"><button class="btn suave" id="d3-repetir">🔁 Ver de nuevo</button><button class="btn suave" id="d3-volver">🧩 Volver a armar</button></div>';
      $("d3-res").innerHTML = h;
      if ($("d3-partes")) $("d3-partes").onclick = etapaPartes;
      bindOtroCamino("caras");
      $("d3-repetir").onclick = function () { $("d3-res").innerHTML = ""; t = 0; animar(); };
      $("d3-volver").onclick = function () { etapaCaras(valido ? null : cs); };
    }
    girable(svg, vista, pintar);
    alSalir(function () { cancelAnimationFrame(raf); });
    pintar();
    setTimeout(animar, 400);
  }

  /* --- 2B. Dibujar el cubo en perspectiva --- */
  function etapaDibujo() {
    var s = lado(), N = 11, x0 = 2, y0 = 9;
    var F = [[x0, y0], [x0 + s, y0], [x0 + s, y0 - s], [x0, y0 - s]];
    var fk = {}; F.forEach(function (p) { fk[k(p)] = true; });
    var aristasF = F.map(function (p, i) { return [p, F[(i + 1) % 4]]; });
    function sk(a, b) { var A = k(a), B = k(b); return A < B ? A + "|" + B : B + "|" + A; }
    var segs = [], sel = null, hecho = null, ayuda = false, d0 = s <= 2 ? 1 : 2;
    pantalla("Dibujar el cubo", etapaCubo,
      '<div class="caja info" id="d-paso"></div>' +
      '<div class="lienzo" id="d-lienzo"></div>' +
      '<div class="herr"><button class="btn suave" id="d-deshacer">↩️ Deshacer</button><button class="btn suave" id="d-borrar">🧽 Borrar</button><button class="btn suave" id="d-ayuda">💡 Ayuda</button></div>' +
      '<div id="d-res"></div>');
    var lz = lienzo($("d-lienzo"), N, N, tocar);
    function evaluar() {
      var E = {}; segs.forEach(function (x) { E[sk(x[0], x[1])] = true; });
      var cand = {};
      function agregarCand(o) { if (o[0] !== 0 && o[1] !== 0) cand[k(o)] = o; }
      segs.forEach(function (sg) {
        var p = sg[0], q = sg[1];
        if (fk[k(p)] && !fk[k(q)]) agregarCand(resta(q, p));
        if (fk[k(q)] && !fk[k(p)]) agregarCand(resta(p, q));
        aristasF.forEach(function (af) {
          var d = resta(q, p), df = resta(af[1], af[0]);
          if (igual(d, df)) agregarCand(resta(p, af[0]));
          if (d[0] === -df[0] && d[1] === -df[1]) agregarCand(resta(q, af[0]));
        });
      });
      var mejor = null;
      Object.keys(cand).forEach(function (key) {
        var o = cand[key], B = F.map(function (p) { return [p[0] + o[0], p[1] + o[1]]; });
        if (B.some(function (p) { return p[0] < 0 || p[1] < 0 || p[0] > N || p[1] > N; })) return;
        var atras = B.filter(function (p, i) { return E[sk(p, B[(i + 1) % 4])]; }).length;
        var uniones = F.filter(function (p, i) { return E[sk(p, B[i])]; }).length;
        if (!mejor || atras + uniones > mejor.atras + mejor.uniones) mejor = { o: o, B: B, atras: atras, uniones: uniones };
      });
      return mejor;
    }
    function textoPaso(m) {
      if (hecho) return "<b>¡Cubo terminado!</b>";
      var a = m ? m.atras : 0, u = m ? m.uniones : 0;
      if (a < 4) return "<b>Paso 1: dibuja el cuadrado de atrás.</b><br>Es igual al de adelante, pero corrido en diagonal (por ejemplo, " + d0 + " a la derecha y " + d0 +
        " hacia arriba). Toca un punto y luego otro para trazar cada línea.<div class=\"cuenta\"><span" + (a === 4 ? ' class="listo"' : "") + ">Cuadrado de atrás: " + a + " de 4</span><span>Uniones: " + u + " de 4</span></div>";
      return "<b>Paso 2: une las esquinas.</b><br>Une cada esquina del cuadrado de adelante con la misma esquina del cuadrado de atrás.<div class=\"cuenta\"><span class=\"listo\">Cuadrado de atrás: 4 de 4</span><span" + (u === 4 ? ' class="listo"' : "") + ">Uniones: " + u + " de 4</span></div>";
    }
    function pintar() {
      var h = poli(F, true, { relleno: "#ff7a5944", trazo: "#ff7a59", grosor: 0.12 });
      if (ayuda && !hecho) h += poli(F.map(function (p) { return [p[0] + d0, p[1] - d0]; }), true, { trazo: "#9aa5b8", grosor: 0.07, guion: "0.2 0.15" });
      if (hecho) {
        var o = hecho.o, B = hecho.B, hx = o[0] > 0 ? x0 : x0 + s, hy = o[1] < 0 ? y0 : y0 - s, H = [hx + o[0], hy + o[1]];
        var todas = aristasF.concat(B.map(function (p, i) { return [p, B[(i + 1) % 4]]; }), F.map(function (p, i) { return [p, B[i]]; }));
        todas.forEach(function (a) {
          var oculta = igual(a[0], H) || igual(a[1], H);
          h += linea(a[0], a[1], oculta ? "#6b6bd6" : "#2b2b3a", oculta ? 0.07 : 0.12, oculta ? "0.2 0.15" : "");
        });
      } else {
        segs.forEach(function (sg) { h += linea(sg[0], sg[1], "#6b6bd6", 0.1); });
      }
      h += puntos(F, "#ff7a59", 0.18);
      if (sel) h += '<circle cx="' + sel[0] + '" cy="' + sel[1] + '" r="0.38" fill="none" stroke="#6b6bd6" stroke-width="0.08" class="pulso"/>' + puntos([sel], "#6b6bd6", 0.2);
      lz.pintar(h);
    }
    function comprobar() {
      var m = evaluar();
      $("d-paso").innerHTML = textoPaso(m);
      if (m && m.atras === 4 && m.uniones === 4) {
        hecho = m; sel = null; marcar("dibujo");
        $("d-paso").innerHTML = textoPaso(m);
        $("d-res").innerHTML = '<div class="fb ok"><b>¡Dibujaste un cubo! 🎉</b><br>Las líneas punteadas son las aristas que quedan escondidas detrás del cubo.</div>' +
          '<button class="btn" id="d-partes">🔍 Ver sus partes</button>' + otroCamino("dibujo");
        $("d-partes").onclick = etapaPartes;
        bindOtroCamino("dibujo");
        decir("¡Dibujaste un cubo! Las líneas punteadas son las aristas que quedan escondidas detrás.");
      }
    }
    function tocar(p) {
      if (hecho) return;
      if (!sel) sel = p;
      else if (igual(sel, p)) sel = null;
      else {
        var key = sk(sel, p);
        var existe = segs.some(function (x) { return sk(x[0], x[1]) === key; }) || aristasF.some(function (a) { return sk(a[0], a[1]) === key; });
        if (!existe) segs.push([sel, p]);
        sel = p;
        comprobar();
      }
      pintar();
    }
    $("d-deshacer").onclick = function () { segs.pop(); sel = null; hecho = null; $("d-res").innerHTML = ""; comprobar(); pintar(); };
    $("d-borrar").onclick = function () { segs = []; sel = null; hecho = null; $("d-res").innerHTML = ""; comprobar(); pintar(); };
    $("d-ayuda").onclick = function () { ayuda = !ayuda; pintar(); };
    comprobar(); pintar();
    decir("Primero dibuja el cuadrado de atrás, igual al de adelante, pero corrido en diagonal. Después une las esquinas.");
  }

  /* ===== 3. Partes del cubo ===== */
  var V = [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return [(i & 1) - 0.5, ((i >> 1) & 1) - 0.5, ((i >> 2) & 1) - 0.5]; });
  var CARAS = [[0, 2, 6, 4], [1, 3, 7, 5], [0, 1, 5, 4], [2, 3, 7, 6], [0, 1, 3, 2], [4, 5, 7, 6]];
  var NORMALES = [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]];
  var ARISTAS = [];
  for (var i = 0; i < 8; i++) for (var j = i + 1; j < 8; j++) if ([1, 2, 4].indexOf(i ^ j) >= 0) ARISTAS.push([i, j]);
  var MODOS = {
    caras: { t: "Caras", uno: "cara", total: 6, color: "#b388eb", def: "Las <b>caras</b> son las superficies planas del cuerpo. Toca cada cara para marcarla." },
    aristas: { t: "Aristas", uno: "arista", total: 12, color: "#1f9a52", def: "Las <b>aristas</b> son las líneas donde se unen dos caras. Toca cada arista para marcarla." },
    vertices: { t: "Vértices", uno: "vértice", total: 8, color: "#e63980", def: "Los <b>vértices</b> son los puntos donde se encuentran tres o más aristas. Toca cada vértice para marcarlo." }
  };
  function etapaPartes() {
    var modo = "caras", vista = { yaw: 0.6, pitch: 0.45 }, marc = { caras: {}, aristas: {}, vertices: {} };
    pantalla("3. Partes del cubo", inicio,
      '<div class="chips" id="p-modos">' + Object.keys(MODOS).map(function (m) { return '<button class="chip" data-modo="' + m + '">' + MODOS[m].t + '</button>'; }).join("") + '</div>' +
      '<div class="caja info" id="p-def"></div>' +
      '<div class="lienzo girar" id="p-lienzo"><svg viewBox="-1.25 -1.25 2.5 2.5"></svg></div>' +
      '<p class="pista center" style="margin-top:8px">👆 Arrastra para girar el cubo. Toca para marcar.</p>' +
      '<div class="cuenta" id="p-cuenta"></div><div id="p-res"></div>' +
      '<button class="btn suave" id="p-reiniciar">🔄 Borrar marcas</button>');
    var svg = $("p-lienzo").firstChild;
    function n(m) { return Object.keys(marc[m]).length; }
    function rot(p) {
      var x = p[0] * Math.cos(vista.yaw) + p[2] * Math.sin(vista.yaw), z = -p[0] * Math.sin(vista.yaw) + p[2] * Math.cos(vista.yaw), y = p[1];
      return [x, y * Math.cos(vista.pitch) - z * Math.sin(vista.pitch), y * Math.sin(vista.pitch) + z * Math.cos(vista.pitch)];
    }
    function pintar() {
      var P = V.map(rot);
      function xy(i) { return P[i][0].toFixed(3) + "," + (-P[i][1]).toFixed(3); }
      var frente = NORMALES.map(function (nn) { return rot(nn)[2] > 1e-6; });
      function visible(ids) { return CARAS.some(function (c, f) { return frente[f] && ids.every(function (x) { return c.indexOf(x) >= 0; }); }); }
      function cara(f, atras) {
        var m = marc.caras[f];
        var h = '<polygon points="' + CARAS[f].map(xy).join(" ") + '" fill="' + (m ? MODOS.caras.color : "#cfe3fb") + '" fill-opacity="' + (atras ? 0.18 : 0.92) +
          '" stroke="none"' + (modo === "caras" && !atras ? ' data-cara="' + f + '" class="toca"' : "") + '/>';
        if (m && !atras) {
          var c = CARAS[f].reduce(function (s, i) { return [s[0] + P[i][0] / 4, s[1] + P[i][1] / 4]; }, [0, 0]);
          h += '<text x="' + c[0].toFixed(3) + '" y="' + (-c[1] + 0.07).toFixed(3) + '" font-size="0.22" font-weight="800" text-anchor="middle" fill="#fff" pointer-events="none">' + marc.caras[f] + '</text>';
        }
        return h;
      }
      function arista(e, atras) {
        var a = ARISTAS[e], m = marc.aristas[e], p1 = P[a[0]], p2 = P[a[1]];
        var h = '<line x1="' + p1[0].toFixed(3) + '" y1="' + (-p1[1]).toFixed(3) + '" x2="' + p2[0].toFixed(3) + '" y2="' + (-p2[1]).toFixed(3) +
          '" stroke="' + (m ? MODOS.aristas.color : atras ? "#9aa5b8" : "#2b2b3a") + '" stroke-width="' + (m ? 0.055 : 0.025) + '" stroke-linecap="round"' +
          (atras && !m ? ' stroke-dasharray="0.06 0.05"' : "") + ' pointer-events="none"/>';
        if (modo === "aristas") h += '<line x1="' + p1[0].toFixed(3) + '" y1="' + (-p1[1]).toFixed(3) + '" x2="' + p2[0].toFixed(3) + '" y2="' + (-p2[1]).toFixed(3) +
          '" stroke="transparent" stroke-width="0.16" data-arista="' + e + '" class="toca"/>';
        return h;
      }
      function vertice(i, atras) {
        var m = marc.vertices[i], p = P[i];
        var h = '<circle cx="' + p[0].toFixed(3) + '" cy="' + (-p[1]).toFixed(3) + '" r="' + (m ? 0.075 : 0.04) + '" fill="' + (m ? MODOS.vertices.color : atras ? "#9aa5b8" : "#2b2b3a") + '" pointer-events="none"/>';
        if (modo === "vertices") h += '<circle cx="' + p[0].toFixed(3) + '" cy="' + (-p[1]).toFixed(3) + '" r="0.14" fill="transparent" data-vertice="' + i + '" class="toca"/>';
        return h;
      }
      var h = "";
      CARAS.forEach(function (_, f) { if (!frente[f]) h += cara(f, true); });
      ARISTAS.forEach(function (a, e) { if (!visible(a)) h += arista(e, true); });
      V.forEach(function (_, i) { if (!visible([i])) h += vertice(i, true); });
      CARAS.forEach(function (_, f) { if (frente[f]) h += cara(f, false); });
      ARISTAS.forEach(function (a, e) { if (visible(a)) h += arista(e, false); });
      V.forEach(function (_, i) { if (visible([i])) h += vertice(i, false); });
      svg.innerHTML = h;
    }
    function contar() {
      $("p-cuenta").innerHTML = Object.keys(MODOS).map(function (m) {
        return '<span' + (n(m) === MODOS[m].total ? ' class="listo"' : "") + '>' + MODOS[m].t + ': ' + n(m) + ' de ' + MODOS[m].total + '</span>';
      }).join("");
    }
    function elegir(m) {
      modo = m;
      Array.prototype.forEach.call(app.querySelectorAll("[data-modo]"), function (b) { b.classList.toggle("activa", b.getAttribute("data-modo") === m); });
      $("p-def").innerHTML = MODOS[m].def;
      $("p-res").innerHTML = "";
      pintar();
      decir(MODOS[m].def.replace(/<[^>]+>/g, ""));
    }
    function marcarParte(tipo, id) {
      if (marc[tipo][id]) { decir("Esa ya la marcaste."); return; }
      marc[tipo][id] = n(tipo) + 1;
      var total = MODOS[tipo].total, c = n(tipo);
      contar(); pintar();
      if (c < total) { decir(String(c)); return; }
      var todo = Object.keys(MODOS).every(function (m) { return n(m) === MODOS[m].total; });
      var sig = Object.keys(MODOS).filter(function (m) { return n(m) < MODOS[m].total; })[0];
      var h = '<div class="fb ok"><b>¡Encontraste ' + (tipo === "caras" ? "las 6 caras" : tipo === "aristas" ? "las 12 aristas" : "los 8 vértices") + '! 🎉</b></div>';
      if (todo) {
        marcar("partes");
        h = '<div class="fb ok"><b>¡Completaste el cubo! 🎉</b><br>El cubo tiene <b>6 caras</b>, <b>12 aristas</b> y <b>8 vértices</b>.</div>' +
          '<button class="btn" id="p-mov">🪞 Ir a movimientos</button>';
        decir("¡Completaste el cubo! El cubo tiene seis caras, doce aristas y ocho vértices.");
      } else {
        h += '<button class="btn alt" id="p-sig">Ahora: ' + MODOS[sig].t + ' ➡️</button>';
        decir("¡Encontraste " + (tipo === "caras" ? "las seis caras" : tipo === "aristas" ? "las doce aristas" : "los ocho vértices") + "!");
      }
      $("p-res").innerHTML = h;
      if ($("p-mov")) $("p-mov").onclick = function () { etapaMov("reflexion"); };
      if ($("p-sig")) $("p-sig").onclick = function () { elegir(sig); };
    }
    girable(svg, vista, pintar, function (el) {
      if (!el || !el.getAttribute) return;
      if (el.hasAttribute("data-cara")) marcarParte("caras", el.getAttribute("data-cara"));
      else if (el.hasAttribute("data-arista")) marcarParte("aristas", el.getAttribute("data-arista"));
      else if (el.hasAttribute("data-vertice")) marcarParte("vertices", el.getAttribute("data-vertice"));
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-modo]"), function (b) { b.onclick = function () { elegir(b.getAttribute("data-modo")); }; });
    $("p-reiniciar").onclick = function () { marc = { caras: {}, aristas: {}, vertices: {} }; contar(); $("p-res").innerHTML = ""; pintar(); };
    contar();
    elegir("caras");
  }

  /* ===== 4. Movimientos ===== */
  var FIGURAS = {
    triangulo: { t: "Triángulo", p: [[0, 0], [0, 3], [3, 3]] },
    ele: { t: "Letra L", p: [[0, 0], [1, 0], [1, 2], [3, 2], [3, 3], [0, 3]] },
    bandera: { t: "Bandera", p: [[0, 0], [3, 1], [1, 2], [1, 4], [0, 4]] }
  };
  function miFigura() {
    var f = G.figura;
    if (!f || f.length < 3 || f.length > 8) return null;
    var w = Math.max.apply(null, f.map(function (p) { return p[0]; })), h = Math.max.apply(null, f.map(function (p) { return p[1]; }));
    return (w <= 5 && h <= 5) ? f : null;
  }
  function mismoConjunto(a, b) {
    if (a.length !== b.length) return false;
    var s = {}; a.forEach(function (p) { s[k(p)] = true; });
    return b.every(function (p) { return s[k(p)]; });
  }
  function flecha(a, b, color) {
    var d = resta(b, a), L = Math.sqrt(len2(d)), u = [d[0] / L, d[1] / L], n = [-u[1], u[0]];
    var punta = [b[0] - u[0] * 0.5, b[1] - u[1] * 0.5];
    return linea(a, punta, color, 0.12) + '<polygon points="' + b[0] + "," + b[1] + " " + (punta[0] + n[0] * 0.3) + "," + (punta[1] + n[1] * 0.3) + " " +
      (punta[0] - n[0] * 0.3) + "," + (punta[1] - n[1] * 0.3) + '" fill="' + color + '"/>';
  }
  function etapaMov(tipo, figKey) {
    var mia = miFigura();
    /* Para la reflexión, una figura simétrica se ve igual en el espejo: mejor partir con otra. */
    var simetrica = mia && (function () {
      var w0 = Math.max.apply(null, mia.map(function (p) { return p[0]; }));
      return mismoConjunto(mia, mia.map(function (p) { return [w0 - p[0], p[1]]; }));
    })();
    figKey = figKey || (mia && !(tipo === "reflexion" && simetrica) ? "mia" : tipo === "reflexion" ? "ele" : "triangulo");
    if (figKey === "mia" && !mia) figKey = "triangulo";
    var fig = figKey === "mia" ? mia : FIGURAS[figKey].p;
    var w = Math.max.apply(null, fig.map(function (p) { return p[0]; })), hgt = Math.max.apply(null, fig.map(function (p) { return p[1]; }));
    var COLS = 14, FILAS = 9, eje = 7, original, esperado, instr, prop, pista, dx = 0, dy = 0;
    if (tipo === "reflexion") {
      var gap = azar(0, 2), x0 = eje - gap - w, y0 = azar(1, Math.max(1, FILAS - 1 - hgt));
      original = fig.map(function (p) { return [p[0] + x0, p[1] + y0]; });
      esperado = original.map(function (p) { return [2 * eje - p[0], p[1]]; });
      instr = "Dibuja la figura reflejada al otro lado del eje, como en un espejo.";
      prop = "La figura mantiene su forma y su tamaño, pero cambia su orientación: queda como en un espejo.";
      pista = "Cada punto debe quedar a la misma distancia del eje, pero al otro lado.";
    } else {
      var xa = 1, ya = azar(0, FILAS - hgt);
      dx = azar(Math.max(3, w + 1), Math.max(Math.max(3, w + 1), COLS - xa - w));
      dx = Math.min(dx, COLS - xa - w);
      dy = azar(Math.max(-3, -ya), Math.min(3, FILAS - hgt - ya));
      original = fig.map(function (p) { return [p[0] + xa, p[1] + ya]; });
      esperado = original.map(function (p) { return [p[0] + dx, p[1] + dy]; });
      var mov = dx + (dx === 1 ? " cuadro" : " cuadros") + " a la derecha" + (dy < 0 ? " y " + (-dy) + " hacia arriba" : dy > 0 ? " y " + dy + " hacia abajo" : "");
      instr = "Traslada la figura " + mov + ".";
      prop = "La figura mantiene su forma, su tamaño y su orientación. Solo cambia de lugar.";
      pista = "Cada punto debe moverse " + mov + ".";
    }
    var opciones = (mia ? [["mia", "Mi figura"]] : []).concat(Object.keys(FIGURAS).map(function (kk) { return [kk, FIGURAS[kk].t]; }));
    pantalla("4. Movimientos", inicio,
      '<div class="chips">' + [["reflexion", "🪞 Reflexión"], ["traslacion", "➡️ Traslación"]].map(function (x) {
        return '<button class="chip' + (x[0] === tipo ? " activa" : "") + '" data-tipo="' + x[0] + '">' + x[1] + (G.hecho[x[0]] ? " ✅" : "") + '</button>';
      }).join("") + '</div>' +
      '<div class="chips peq">' + opciones.map(function (o) { return '<button class="chip' + (o[0] === figKey ? " activa" : "") + '" data-fig="' + o[0] + '">' + o[1] + '</button>'; }).join("") + '</div>' +
      '<div class="caja info"><b>' + instr + '</b><br>Toca los puntos para dibujarla y cierra tocando el primer punto.</div>' +
      '<div class="lienzo" id="m-lienzo"></div>' +
      '<div class="herr"><button class="btn suave" id="m-deshacer">↩️ Deshacer</button><button class="btn suave" id="m-borrar">🧽 Borrar</button></div>' +
      '<div id="m-res"></div>');
    var verRespuesta = false, anim = null, raf = 0, resuelto = false;
    function fondo() {
      var h = poli(original, true, { relleno: "#ff7a5966", trazo: "#ff7a59", grosor: 0.1 });
      if (tipo === "reflexion") h += linea([eje, -0.4], [eje, FILAS + 0.4], "#2f80ed", 0.09, "0.3 0.2") +
        '<text x="' + (eje + 0.2) + '" y="-0.15" font-size="0.45" fill="#2f80ed" font-weight="700">eje</text>';
      else h += flecha(original[0], esperado[0], "#2f80ed");
      if (verRespuesta) h += poli(esperado, true, { trazo: "#1f9a52", grosor: 0.08, guion: "0.25 0.15" });
      return h;
    }
    function encima() { return anim ? poli(anim, true, { relleno: "#ffd166aa", trazo: "#e8a317", grosor: 0.1 }) : ""; }
    var tz = trazador($("m-lienzo"), COLS, FILAS, {
      fondo: fondo, encima: encima, bloqueado: function () { return resuelto; },
      aviso: function (t) { caja("m-res", t); },
      alCambiar: function () { $("m-res").innerHTML = ""; },
      alCerrar: function (pts) {
        var r = limpiar(pts), ok = r.length >= 3 && simple(r) && mismoConjunto(r, limpiar(esperado)), h;
        if (ok) {
          resuelto = true; marcar(tipo);
          h = '<div class="fb ok"><b>¡Correcto! 🎉</b><br>' + prop + '</div>' +
            '<button class="btn" id="m-ver">▶️ Ver el movimiento</button><button class="btn alt" id="m-otro">🔁 Otro ejercicio</button>';
          decir("¡Correcto! " + prop);
        } else {
          h = '<div class="fb bad"><b>Casi… 💪</b><br>' + pista + '</div>' +
            '<div class="fila"><button class="btn suave" id="m-reint">✏️ Intentar de nuevo</button><button class="btn suave" id="m-resp">👀 Ver la respuesta</button></div>';
          decir("Casi. " + pista);
        }
        $("m-res").innerHTML = h;
        if ($("m-ver")) $("m-ver").onclick = animar;
        if ($("m-otro")) $("m-otro").onclick = function () { etapaMov(tipo, figKey); };
        if ($("m-reint")) $("m-reint").onclick = tz.borrar;
        if ($("m-resp")) $("m-resp").onclick = function () { verRespuesta = true; tz.pintar(); };
      }
    });
    function animar() {
      var ini = null;
      cancelAnimationFrame(raf);
      function paso(ts) {
        if (ini === null) ini = ts;
        var x = Math.min(1, (ts - ini) / 1600), e = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
        anim = tipo === "reflexion"
          ? original.map(function (p) { return [eje + (p[0] - eje) * Math.cos(Math.PI * e), p[1]]; })
          : original.map(function (p) { return [p[0] + dx * e, p[1] + dy * e]; });
        tz.pintar();
        if (x < 1) raf = requestAnimationFrame(paso);
        else setTimeout(function () { anim = null; tz.pintar(); }, 700);
      }
      raf = requestAnimationFrame(paso);
    }
    alSalir(function () { cancelAnimationFrame(raf); });
    Array.prototype.forEach.call(app.querySelectorAll("[data-tipo]"), function (b) { b.onclick = function () { etapaMov(b.getAttribute("data-tipo"), figKey); }; });
    Array.prototype.forEach.call(app.querySelectorAll("[data-fig]"), function (b) { b.onclick = function () { etapaMov(tipo, b.getAttribute("data-fig")); }; });
    $("m-deshacer").onclick = function () { if (!resuelto) tz.deshacer(); };
    $("m-borrar").onclick = function () { resuelto = false; verRespuesta = false; tz.borrar(); };
    decir(instr);
  }

  /* ===== Arranque ===== */
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("../sw.js", { scope: "../" }).catch(function () { /* sin conexión */ });
  }
  inicio();
})();
