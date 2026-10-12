/* Funciones comunes: utilidades, voz, lectura y validación del contenido.
   Se usa tanto en la app como en el HTML que se descarga para el alumno. */
var Comun = (function () {
  "use strict";

  var COLORES = ["#ec4f8a", "#8b5cf6", "#1f9a52", "#2f80ed", "#e8a317", "#d946a8", "#0ea5a4", "#f97316"];
  var ICONOS = ["📘", "🔑", "⭐", "🌈", "🐾", "🎈", "🍀", "🚀"];

  function mezclar(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function leer(clave, porDefecto) {
    try { var v = localStorage.getItem(clave); return v == null ? porDefecto : JSON.parse(v); }
    catch (e) { return porDefecto; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); return true; } catch (e) { return false; }
  }

  /* ===== Voz ===== */
  var vozActiva = leer("repaso-voz", true);
  var hayVoz = "speechSynthesis" in window;
  var voces = [];
  function cargarVoces() { if (hayVoz) voces = speechSynthesis.getVoices(); }
  if (hayVoz) { cargarVoces(); speechSynthesis.onvoiceschanged = cargarVoces; }
  function elegirVoz() {
    var pref = ["es-cl", "es-419", "es-us", "es-mx", "es-ar", "es-es", "es"];
    for (var i = 0; i < pref.length; i++) {
      for (var j = 0; j < voces.length; j++) {
        if ((voces[j].lang || "").replace("_", "-").toLowerCase().indexOf(pref[i]) === 0) return voces[j];
      }
    }
    return null;
  }
  function limpiarEmoji(t) {
    return String(t).replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]|[☀-➿]|‍|️/g, "");
  }
  function hablar(t, forzar) {
    if (!hayVoz || !(vozActiva || forzar)) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(limpiarEmoji(t));
    var v = elegirVoz();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "es-CL";
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }
  function callar() { if (hayVoz) speechSynthesis.cancel(); }
  function alternarVoz() {
    vozActiva = !vozActiva; guardar("repaso-voz", vozActiva);
    if (vozActiva) hablar("Voz activada", true); else callar();
    return vozActiva;
  }
  function vozEncendida() { return vozActiva; }

  /* ===== Leer la respuesta de la IA ===== */
  function extraerJSON(texto) {
    var t = String(texto || "").replace(/```(?:json)?/gi, "").trim();
    var a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a < 0 || b <= a) {
      throw new Error("No encontré el bloque de datos. Copia la respuesta completa de la IA, desde la primera llave { hasta la última }.");
    }
    var s = t.slice(a, b + 1);
    try { return JSON.parse(s); } catch (e) { /* se intenta reparar abajo */ }
    var s2 = s.replace(/[“”„«»]/g, '"').replace(/,\s*([}\]])/g, "$1");
    try { return JSON.parse(s2); } catch (e) {
      throw new Error("La respuesta está incompleta o tiene un error. Pídele a la IA: \"Entrégame de nuevo solo el bloque JSON completo\" y vuelve a pegarlo.");
    }
  }

  function txt(v) { return typeof v === "string" ? v.trim() : (typeof v === "number" ? String(v) : ""); }
  function bool(v) {
    if (typeof v === "boolean") return v;
    var s = String(v).toLowerCase().trim();
    if (["true", "verdadero", "verdadera", "v", "si", "sí"].indexOf(s) >= 0) return true;
    if (["false", "falso", "falsa", "f", "no"].indexOf(s) >= 0) return false;
    return null;
  }
  function seguro(v) { return !(v === false || String(v).toLowerCase() === "false"); }
  function lista(v) { return (Array.isArray(v) ? v : []).map(txt).filter(Boolean); }

  /* Revisa y ordena el contenido. Devuelve {libro, avisos, errores}. */
  function validar(raw) {
    var avisos = [], errores = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { libro: null, avisos: avisos, errores: ["El contenido no tiene el formato esperado."] };
    }
    var L = {
      titulo: txt(raw.titulo) || "Libro sin título",
      autor: txt(raw.autor),
      curso: txt(raw.curso),
      modo: raw.modo === "guia" ? "guia" : "libro",
      preguntas: [], verdaderoFalso: [], completar: []
    };
    if (!txt(raw.titulo)) avisos.push("No venía el título del libro.");

    var mapa = {};
    lista0(raw.preguntas).forEach(function (p, i) {
      p = p || {};
      var preg = txt(p.pregunta), resp = txt(p.respuesta);
      if (!preg || !resp) { avisos.push("Se omitió la pregunta " + (i + 1) + " porque le faltaba la pregunta o la respuesta."); return; }
      var n = L.preguntas.length;
      mapa[i + 1] = n + 1;
      L.preguntas.push({
        titulo: txt(p.titulo) || ("Pregunta " + (n + 1)),
        icono: txt(p.icono) || ICONOS[n % ICONOS.length],
        pregunta: preg, respuesta: resp,
        correcta: txt(p.correcta),
        incorrectas: lista(p.incorrectas).slice(0, 3),
        seguro: seguro(p.seguro)
      });
    });
    function ref(v) { var k = parseInt(v, 10); return mapa[k] || null; }

    lista0(raw.verdaderoFalso).forEach(function (x, i) {
      x = x || {};
      var f = txt(x.frase), v = bool(x.esVerdadera);
      if (!f || v === null) { avisos.push("Se omitió la frase de verdadero o falso n° " + (i + 1) + " porque estaba incompleta."); return; }
      L.verdaderoFalso.push({ frase: f, esVerdadera: v, explicacion: txt(x.explicacion), pregunta: ref(x.pregunta), seguro: seguro(x.seguro) });
    });

    lista0(raw.completar).forEach(function (x, i) {
      x = x || {};
      var f = txt(x.frase).replace(/_{2,}/g, "___");
      var r = lista(x.respuestas);
      var espacios = (f.match(/___/g) || []).length;
      if (!f || !espacios || espacios !== r.length) {
        avisos.push("Se omitió la oración para completar n° " + (i + 1) + " porque los espacios no calzaban con las respuestas.");
        return;
      }
      var bajas = r.map(function (w) { return w.toLowerCase(); });
      var d = lista(x.distractores).filter(function (w) { return bajas.indexOf(w.toLowerCase()) < 0; }).slice(0, 4);
      L.completar.push({ frase: f, respuestas: r, distractores: d, pregunta: ref(x.pregunta), seguro: seguro(x.seguro) });
    });

    if (L.preguntas.length && !L.preguntas.some(conAlternativas)) {
      avisos.push("Las preguntas no traían alternativas, así que la sección de alternativas no aparecerá.");
    }
    if (!L.preguntas.length && !L.verdaderoFalso.length && !L.completar.length) {
      errores.push("No encontré ejercicios. Revisa que copiaste toda la respuesta de la IA.");
    }
    return { libro: L, avisos: avisos, errores: errores };
  }
  function lista0(v) { return Array.isArray(v) ? v : []; }
  function conAlternativas(p) { return !!p.correcta && p.incorrectas.length > 0; }

  function decorar(L) {
    L.preguntas.forEach(function (p, i) { p.n = i + 1; p.color = COLORES[i % COLORES.length]; });
    return L;
  }

  /* ===== Comprimir para compartir por enlace ===== */
  function aB64(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function deB64(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var b = atob(s), u = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }
  function comprimir(obj) {
    var bytes = new TextEncoder().encode(JSON.stringify(obj));
    if (!window.CompressionStream) return Promise.resolve("u" + aB64(bytes));
    var flujo = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    return new Response(flujo).arrayBuffer().then(function (buf) { return "z" + aB64(new Uint8Array(buf)); });
  }
  function descomprimir(s) {
    var tipo = s.charAt(0), u = deB64(s.slice(1));
    var p = tipo === "z"
      ? new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer().then(function (b) { return new Uint8Array(b); })
      : Promise.resolve(u);
    return p.then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
  }

  /* Contenido limpio para guardar o compartir (sin datos de presentación). */
  function limpio(L) {
    return {
      titulo: L.titulo, autor: L.autor, curso: L.curso, modo: L.modo,
      preguntas: L.preguntas.map(function (p) {
        return { titulo: p.titulo, icono: p.icono, pregunta: p.pregunta, respuesta: p.respuesta, correcta: p.correcta, incorrectas: p.incorrectas, seguro: p.seguro };
      }),
      verdaderoFalso: L.verdaderoFalso, completar: L.completar
    };
  }

  return {
    COLORES: COLORES, mezclar: mezclar, esc: esc, leer: leer, guardar: guardar,
    hablar: hablar, callar: callar, alternarVoz: alternarVoz, vozEncendida: vozEncendida,
    extraerJSON: extraerJSON, validar: validar, decorar: decorar, conAlternativas: conAlternativas,
    comprimir: comprimir, descomprimir: descomprimir, limpio: limpio
  };
})();
