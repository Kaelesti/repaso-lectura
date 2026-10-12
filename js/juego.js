/* Motor de juego: muestra las 4 secciones a partir del contenido de un libro.
   Uso: Juego.iniciar(libro, contenedor, { alSalir: fn, alGuardar: fn }) */
var Juego = (function () {
  "use strict";
  var C = Comun, esc = C.esc;
  var raiz, L, op, S = {};
  var LETRAS = ["A", "B", "C", "D"];
  var BIEN = ["¡Muy bien!", "¡Excelente!", "¡Correcto!", "¡Bien hecho!"];
  function bien() { return BIEN[Math.floor(Math.random() * BIEN.length)]; }
  function $(s) { return raiz.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(raiz.querySelectorAll(s)); }

  function iniciar(libro, contenedor, opciones) {
    raiz = contenedor;
    op = opciones || {};
    L = C.decorar(JSON.parse(JSON.stringify(libro)));
    raiz.innerHTML =
      '<header class="barra"><button class="hbtn" id="j-atras" aria-label="Volver">⬅️</button>' +
      '<h1 id="j-titulo"></h1><button class="hbtn" id="j-voz" aria-label="Voz"></button></header>' +
      '<main class="zona" id="j-zona"></main>';
    pintarVoz();
    $("#j-voz").onclick = function () { C.alternarVoz(); pintarVoz(); };
    menu();
  }
  function pintarVoz() { $("#j-voz").textContent = C.vozEncendida() ? "🔊" : "🔇"; }
  function zona() { return $("#j-zona"); }
  function encabezado(t, atras) {
    $("#j-titulo").textContent = t;
    var b = $("#j-atras");
    b.classList.toggle("oculto", !atras);
    b.onclick = atras || null;
    window.scrollTo(0, 0);
  }
  function deP(k) { return k ? L.preguntas[k - 1] : null; }
  function cabeza(p) {
    if (!p) return '<div class="qhead"><div class="qtitle">' + esc(L.titulo) + '</div><div class="qicon">📘</div></div>';
    return '<div class="qhead"><div class="num">' + p.n + '</div><div class="qtitle">' + esc(p.titulo) +
      '</div><div class="qicon">' + esc(p.icono) + '</div></div>';
  }
  function colorDe(p) { return p ? p.color : "var(--accent)"; }
  function progreso() { return '<div class="progreso"><span>' + (S.i + 1) + ' de ' + S.lista.length + '</span><span>⭐ ' + S.puntos + '</span></div>'; }
  function botonSiguiente() { return '<button class="btn" id="j-sig">' + (S.i + 1 < S.lista.length ? "Siguiente ➡️" : "Ver resultado 🏁") + '</button>'; }
  function avanzar(mostrar, reiniciar) {
    $("#j-sig").onclick = function () {
      S.i++;
      if (S.i < S.lista.length) mostrar(); else resultado(reiniciar);
    };
  }

  /* ===== Menú ===== */
  function menu() {
    C.callar();
    encabezado(L.titulo, op.alSalir || null);
    var alt = L.preguntas.filter(C.conAlternativas);
    var h = '<div class="intro">📖 <b>' + esc(L.titulo) + '</b>' +
      (L.autor ? '<br><small>' + esc(L.autor) + '</small>' : "") + '</div><div class="menu">';
    if (alt.length) h += boton("alt", "#ffe1ec", "🅰️", "Alternativas", "Elige la respuesta correcta");
    if (L.verdaderoFalso.length) h += boton("vf", "#dff5e7", "✅", "Verdadero o falso", "¿La frase es verdad o no?");
    if (L.completar.length) h += boton("cp", "#e6e8ff", "✏️", "Completa la oración", "Toca las palabras que faltan");
    if (L.preguntas.length) h += boton("dado", "#fff0c2", "🎲", "Tirar el dado", "Practica como en la prueba");
    h += '</div>';
    if (op.alGuardar) h += '<button class="btn alt" id="j-guardar">💾 Guardar este libro en el celular</button>';
    h += '<p class="nota">Toca 🔊 Escuchar para oír cada pregunta.<br>Arriba a la derecha puedes apagar o prender la voz.</p>';
    zona().innerHTML = h;
    var ir = { alt: iniciarAlt, vf: iniciarVF, cp: iniciarCP, dado: iniciarDado };
    $$("[data-ir]").forEach(function (b) { b.onclick = function () { ir[b.getAttribute("data-ir")](); }; });
    if (op.alGuardar) $("#j-guardar").onclick = function () { op.alGuardar(this); };
  }
  function boton(id, fondo, ic, t, s) {
    return '<button class="mbtn" style="background:' + fondo + '" data-ir="' + id + '"><span class="ic">' + ic +
      '</span><span>' + t + '<small>' + s + '</small></span></button>';
  }

  function resultado(reiniciar) {
    encabezado("¡Terminaste!", menu);
    var r = S.puntos / S.lista.length;
    var est = r === 1 ? "⭐⭐⭐" : r >= 0.6 ? "⭐⭐" : r > 0 ? "⭐" : "💪";
    var msg = r === 1 ? "¡Perfecto! Te lo sabes todo." : r >= 0.6 ? "¡Muy bien! Ya casi lo tienes." : "Sigue practicando. ¡Tú puedes!";
    zona().innerHTML = '<div class="card center" style="--c:var(--accent)"><div class="estrellas">' + est +
      '</div><div class="grande">' + S.puntos + ' de ' + S.lista.length + '</div><p>' + msg + '</p>' +
      '<button class="btn" id="j-otra">🔁 Jugar otra vez</button><button class="btn alt" id="j-menu">🏠 Volver al menú</button></div>';
    $("#j-otra").onclick = reiniciar;
    $("#j-menu").onclick = menu;
    C.hablar("Tuviste " + S.puntos + " de " + S.lista.length + ". " + msg);
  }

  /* ===== 1. Alternativas ===== */
  function iniciarAlt() { S = { lista: C.mezclar(L.preguntas.filter(C.conAlternativas)), i: 0, puntos: 0 }; mostrarAlt(); }
  function mostrarAlt() {
    encabezado("Alternativas", menu);
    var p = S.lista[S.i];
    var ops = C.mezclar([{ t: p.correcta, c: true }].concat(p.incorrectas.map(function (t) { return { t: t, c: false }; })));
    zona().innerHTML = progreso() + '<div class="card" style="--c:' + p.color + '">' + cabeza(p) +
      '<div class="qtext">' + esc(p.pregunta) + '</div><button class="hablar" id="j-oir">🔊 Escuchar</button>' +
      '<div class="opts">' + ops.map(function (o, k) {
        return '<button class="opt" data-k="' + k + '"><b>' + LETRAS[k] + ')</b> ' + esc(o.t) + '</button>';
      }).join("") + '</div><div id="j-fb"></div></div>';
    var leer = function (f) { C.hablar(p.pregunta + " " + ops.map(function (o, k) { return LETRAS[k] + ". " + o.t; }).join(" "), f); };
    $("#j-oir").onclick = function () { leer(true); };
    leer(false);
    $$(".opt").forEach(function (b) {
      b.onclick = function () {
        var k = +b.getAttribute("data-k"), ok = ops[k].c;
        $$(".opt").forEach(function (x) { x.disabled = true; if (ops[+x.getAttribute("data-k")].c) x.classList.add("ok"); });
        if (ok) S.puntos++; else b.classList.add("bad");
        var t = ok ? bien() + " 🎉" : "Casi… 💪 La respuesta es:";
        $("#j-fb").innerHTML = '<div class="fb ' + (ok ? "ok" : "bad") + '"><b>' + t + '</b><br>' + esc(p.respuesta) + '</div>' + botonSiguiente();
        C.hablar(t + " " + p.respuesta);
        avanzar(mostrarAlt, iniciarAlt);
      };
    });
  }

  /* ===== 2. Verdadero o falso ===== */
  function iniciarVF() { S = { lista: C.mezclar(L.verdaderoFalso), i: 0, puntos: 0 }; mostrarVF(); }
  function mostrarVF() {
    encabezado("Verdadero o falso", menu);
    var it = S.lista[S.i], p = deP(it.pregunta);
    zona().innerHTML = progreso() + '<div class="card" style="--c:' + colorDe(p) + '">' + cabeza(p) +
      '<p class="pista">¿Esta frase es verdadera o falsa?</p><div class="frase">' + esc(it.frase) + '</div>' +
      '<button class="hablar" id="j-oir">🔊 Escuchar</button><div class="vf">' +
      '<button class="opt" data-v="1">✔️ Verdadero</button><button class="opt" data-v="0">✖️ Falso</button></div><div id="j-fb"></div></div>';
    var leer = function (f) { C.hablar("¿Verdadero o falso? " + it.frase, f); };
    $("#j-oir").onclick = function () { leer(true); };
    leer(false);
    $$(".opt").forEach(function (b) {
      b.onclick = function () {
        var ok = (b.getAttribute("data-v") === "1") === it.esVerdadera;
        $$(".opt").forEach(function (x) { x.disabled = true; if ((x.getAttribute("data-v") === "1") === it.esVerdadera) x.classList.add("ok"); });
        if (ok) S.puntos++; else b.classList.add("bad");
        var palabra = it.esVerdadera ? "Es verdadero." : "Es falso.";
        var t = ok ? bien() + " 🎉 " + palabra : "Casi… 💪 " + palabra;
        $("#j-fb").innerHTML = '<div class="fb ' + (ok ? "ok" : "bad") + '"><b>' + t + '</b>' +
          (it.explicacion ? '<br>' + esc(it.explicacion) : "") + '</div>' + botonSiguiente();
        C.hablar(t + " " + it.explicacion);
        avanzar(mostrarVF, iniciarVF);
      };
    });
  }

  /* ===== 3. Completar la oración ===== */
  function iniciarCP() { S = { lista: C.mezclar(L.completar), i: 0, puntos: 0 }; nuevaCP(); }
  function nuevaCP() {
    var it = S.lista[S.i];
    S.fichas = C.mezclar(it.respuestas.concat(it.distractores)).map(function (w) { return { w: w, usada: false }; });
    S.lleno = it.respuestas.map(function () { return null; });
    S.revisado = false;
    dibujarCP(true);
  }
  function igual(a, b) { return a.trim().toLowerCase() === b.trim().toLowerCase(); }
  function textoCP(it, conRespuestas) {
    var k = 0;
    return it.frase.replace(/___/g, function () { var w = conRespuestas ? it.respuestas[k] : "espacio"; k++; return w; });
  }
  function dibujarCP(primera) {
    encabezado("Completa la oración", menu);
    var it = S.lista[S.i], p = deP(it.pregunta);
    var trozos = it.frase.split("___");
    var oracion = trozos.map(function (tr, x) {
      var h = esc(tr);
      if (x < trozos.length - 1) {
        var f = S.lleno[x];
        var cls = "blanco" + (f !== null ? " lleno" : "");
        if (S.revisado) cls += (f !== null && igual(S.fichas[f].w, it.respuestas[x])) ? " ok" : " bad";
        h += '<span class="' + cls + '" data-b="' + x + '">' + (f !== null ? esc(S.fichas[f].w) : "&nbsp;") + '</span>';
      }
      return h;
    }).join("");
    var completo = S.lleno.every(function (f) { return f !== null; });
    zona().innerHTML = progreso() + '<div class="card" style="--c:' + colorDe(p) + '">' + cabeza(p) +
      '<p class="pista">Toca las palabras para llenar los espacios. Si te equivocas, toca el espacio para borrar.</p>' +
      '<div class="oracion">' + oracion + '</div><button class="hablar" id="j-oir">🔊 Escuchar</button>' +
      '<div class="fichas" style="margin-top:14px">' + S.fichas.map(function (c, k) {
        return '<button class="ficha' + (c.usada ? " usada" : "") + '" data-c="' + k + '"' + (S.revisado ? " disabled" : "") + '>' + esc(c.w) + '</button>';
      }).join("") + '</div><div id="j-fb"></div>' +
      (S.revisado ? "" : '<button class="btn" id="j-rev"' + (completo ? "" : " disabled") + '>Revisar ✔️</button>') + '</div>';
    var leer = function (f) { C.hablar("Completa la oración. " + textoCP(it, false), f); };
    $("#j-oir").onclick = function () { leer(true); };
    if (primera) leer(false);
    if (S.revisado) return;
    $$(".ficha").forEach(function (b) {
      b.onclick = function () {
        var k = +b.getAttribute("data-c"), e = S.lleno.indexOf(null);
        if (e < 0 || S.fichas[k].usada) return;
        S.lleno[e] = k; S.fichas[k].usada = true; C.hablar(S.fichas[k].w); dibujarCP(false);
      };
    });
    $$(".blanco").forEach(function (b) {
      b.onclick = function () {
        var x = +b.getAttribute("data-b"), f = S.lleno[x];
        if (f === null) return;
        S.fichas[f].usada = false; S.lleno[x] = null; dibujarCP(false);
      };
    });
    $("#j-rev").onclick = function () {
      S.revisado = true;
      var ok = S.lleno.every(function (f, x) { return igual(S.fichas[f].w, it.respuestas[x]); });
      if (ok) S.puntos++;
      dibujarCP(false);
      var t = ok ? bien() + " 🎉" : "Casi… 💪 Así es la oración:";
      var o = textoCP(it, true);
      $("#j-fb").innerHTML = '<div class="fb ' + (ok ? "ok" : "bad") + '"><b>' + t + '</b><br>' + esc(o) + '</div>' + botonSiguiente();
      C.hablar(t + " " + o);
      avanzar(nuevaCP, iniciarCP);
    };
  }

  /* ===== 4. Tirar el dado ===== */
  var ultima = null;
  function iniciarDado() {
    C.callar();
    encabezado("Tirar el dado", menu);
    zona().innerHTML = '<div class="card center" style="--c:var(--accent)"><p class="pista">Tira el dado. Responde en voz alta, como en la prueba. Después mira si lo dijiste bien.</p>' +
      '<div class="dado" id="j-dado">🎲</div><button class="btn" id="j-tirar">🎲 Tirar el dado</button></div><div id="j-dq"></div>';
    $("#j-tirar").onclick = tirar;
  }
  function tirar() {
    var dado = $("#j-dado"), btn = $("#j-tirar"), P = L.preguntas;
    btn.disabled = true; $("#j-dq").innerHTML = ""; C.callar();
    dado.classList.add("gira");
    var t = setInterval(function () { var r = P[Math.floor(Math.random() * P.length)]; dado.textContent = r.icono; dado.style.setProperty("--c", r.color); }, 90);
    setTimeout(function () {
      clearInterval(t); dado.classList.remove("gira");
      var p;
      do { p = P[Math.floor(Math.random() * P.length)]; } while (P.length > 1 && p === ultima);
      ultima = p;
      dado.textContent = p.icono; dado.style.setProperty("--c", p.color);
      btn.disabled = false; btn.textContent = "🎲 Tirar otra vez";
      $("#j-dq").innerHTML = '<div class="card" style="--c:' + p.color + '">' + cabeza(p) +
        '<div class="qtext">' + esc(p.pregunta) + '</div><button class="hablar" id="j-oir">🔊 Escuchar</button>' +
        '<div id="j-resp"><button class="btn alt" id="j-ver">👀 Ver la respuesta</button></div></div>';
      var leer = function (f) { C.hablar("Salió " + p.titulo + ". " + p.pregunta, f); };
      $("#j-oir").onclick = function () { leer(true); };
      leer(false);
      $("#j-ver").onclick = function () {
        $("#j-resp").innerHTML = '<div class="fb info"><b>Respuesta:</b><br>' + esc(p.respuesta) + '</div>';
        C.hablar(p.respuesta);
      };
    }, 1300);
  }

  return { iniciar: iniciar };
})();
