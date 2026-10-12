/* App principal: inicio, sección del apoderado y sección del alumno. */
(function () {
  "use strict";
  var C = Comun, esc = C.esc;
  var app = document.getElementById("app");
  var CLAVE = "repaso-libros";
  var F = null; // libro que el apoderado está preparando

  var FUENTES =
    '<div class="caja info"><b>📚 ¿Dónde conseguir el libro?</b><ul>' +
    '<li><a href="https://bdescolar.mineduc.cl" target="_blank" rel="noopener">Biblioteca Digital Escolar</a> (Mineduc): gratis para alumnos de colegios municipales y subvencionados. Se entra con el RUT del alumno.</li>' +
    '<li><a href="https://www.bpdigital.cl" target="_blank" rel="noopener">Biblioteca Pública Digital</a>: gratis para cualquier persona que se inscriba.</li>' +
    '</ul></div>';

  /* ===== Utilidades de pantalla ===== */
  function pantalla(titulo, atras, html) {
    C.callar();
    app.innerHTML = '<header class="barra"><button class="hbtn' + (atras ? "" : " oculto") + '" id="a-atras" aria-label="Volver">⬅️</button>' +
      '<h1>' + esc(titulo) + '</h1></header><main class="zona">' + html + '</main>';
    if (atras) document.getElementById("a-atras").onclick = atras;
    window.scrollTo(0, 0);
  }
  function $(id) { return document.getElementById(id); }
  function pasos(n) {
    var h = '<div class="pasos">';
    for (var i = 1; i <= 4; i++) h += '<span class="' + (i <= n ? "hecho" : "") + '"></span>';
    return h + '</div>';
  }
  function copiar(texto, boton, etiqueta) {
    function listo() { boton.textContent = "✅ ¡Copiado!"; setTimeout(function () { boton.textContent = etiqueta; }, 2000); }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(listo, function () { copiarViejo(texto); listo(); });
    } else { copiarViejo(texto); listo(); }
  }
  function copiarViejo(texto) {
    var t = document.createElement("textarea");
    t.value = texto; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch (e) { /* sin acción */ }
    document.body.removeChild(t);
  }
  function descargar(nombre, contenido, tipo) {
    var url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    var a = document.createElement("a");
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  }
  function nombreArchivo(t) {
    return (t || "libro").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "libro";
  }

  /* ===== Libros guardados en este celular ===== */
  function libros() { return C.leer(CLAVE, {}); }
  function guardarLibro(libro, id) {
    var todos = libros();
    id = id || (nombreArchivo(libro.titulo) + "-" + Date.now().toString(36));
    todos[id] = { libro: C.limpio(libro), fecha: Date.now() };
    return C.guardar(CLAVE, todos) ? id : null;
  }
  function borrarLibro(id) { var t = libros(); delete t[id]; C.guardar(CLAVE, t); }
  function listaOrdenada() {
    var t = libros();
    return Object.keys(t).map(function (id) { return { id: id, libro: t[id].libro, fecha: t[id].fecha }; })
      .sort(function (a, b) { return b.fecha - a.fecha; });
  }
  function resumen(L) {
    return L.preguntas.length + " preguntas · " + L.verdaderoFalso.length + " V/F · " + L.completar.length + " para completar";
  }

  function jugar(libro, volver, alGuardar) {
    var v = C.validar(libro);
    if (!v.libro) return;
    Juego.iniciar(v.libro, app, { alSalir: volver, alGuardar: alGuardar });
  }

  /* ===== Inicio ===== */
  function inicio() {
    pantalla("Repaso de lectura", null,
      '<div class="intro"><div style="font-size:54px">📚</div><b>Repasa los libros del colegio</b><br><small>Con preguntas, juegos y voz</small></div>' +
      '<div class="menu">' +
      '<button class="mbtn" style="background:#ffe1ec" id="a-apo"><span class="ic">🧑‍🏫</span><span>Soy apoderado<small>Preparo el material de un libro</small></span></button>' +
      '<button class="mbtn" style="background:#dff5e7" id="a-alu"><span class="ic">🧒</span><span>Soy alumno<small>Quiero repasar y jugar</small></span></button>' +
      '</div><p class="nota">Funciona sin internet una vez abierta.</p>');
    $("a-apo").onclick = apoderado;
    $("a-alu").onclick = alumno;
  }

  /* ===== Alumno ===== */
  function alumno() {
    var ls = listaOrdenada();
    var h = '<h2>Mis libros</h2>';
    if (!ls.length) {
      h += '<div class="caja info">Aún no hay libros en este celular. Pídele a tu apoderado el enlace o el archivo del libro.</div>';
    } else {
      ls.forEach(function (x) {
        h += '<div class="card" style="--c:#1f9a52"><div class="lista-libro"><span class="ic">📘</span><div class="txt"><b>' + esc(x.libro.titulo) +
          '</b><small>' + esc(x.libro.autor || "") + '</small></div><button class="mini" data-jugar="' + esc(x.id) + '">▶️ Jugar</button></div></div>';
      });
    }
    pantalla("Soy alumno", inicio, h);
    Array.prototype.forEach.call(document.querySelectorAll("[data-jugar]"), function (b) {
      b.onclick = function () { jugar(libros()[b.getAttribute("data-jugar")].libro, alumno); };
    });
  }

  /* ===== Apoderado: inicio ===== */
  function apoderado() {
    var ls = listaOrdenada();
    var h = '<button class="btn" id="a-nuevo">➕ Preparar un libro nuevo</button>' +
      '<button class="btn suave" id="a-importar">📥 Cargar un archivo de otro apoderado</button>' +
      '<h3>Libros guardados en este celular</h3>';
    if (!ls.length) {
      h += '<div class="caja info">Todavía no hay libros. Puedes preparar uno nuevo o <a href="#" id="a-ejemplo">ver el ejemplo de Papelucho</a>.</div>';
    } else {
      ls.forEach(function (x) {
        h += '<div class="card" style="--c:var(--accent)"><div class="lista-libro"><span class="ic">📘</span><div class="txt"><b>' + esc(x.libro.titulo) +
          '</b><small>' + esc(resumen(x.libro)) + '</small></div>' +
          '<button class="mini borrar" data-borrar="' + esc(x.id) + '" aria-label="Borrar">🗑️</button></div><div class="fila" style="margin-top:10px">' +
          '<button class="mini" data-ver="' + esc(x.id) + '">✏️ Revisar</button>' +
          '<button class="mini" data-jugar="' + esc(x.id) + '">▶️ Probar</button>' +
          '<button class="mini" data-compartir="' + esc(x.id) + '">📤 Compartir</button></div></div>';
      });
      h += '<p class="nota"><a href="#" id="a-ejemplo">Ver el ejemplo de Papelucho</a></p>';
    }
    pantalla("Soy apoderado", inicio, h);
    $("a-nuevo").onclick = function () { F = { titulo: "", autor: "", curso: "5° básico", capitulos: "", tengoLibro: true, tengoGuia: false, cantidad: 10 }; paso1(); };
    $("a-importar").onclick = importar;
    var ej = $("a-ejemplo");
    if (ej) ej.onclick = function (e) { e.preventDefault(); cargarEjemplo(); };
    accionesLista();
  }
  function accionesLista() {
    function cada(attr, fn) {
      Array.prototype.forEach.call(document.querySelectorAll("[" + attr + "]"), function (b) {
        b.onclick = function () { var id = b.getAttribute(attr); fn(id, libros()[id].libro); };
      });
    }
    cada("data-ver", function (id, l) { var v = C.validar(l); F = { id: id, libro: v.libro, avisos: [] }; paso4(); });
    cada("data-jugar", function (id, l) { jugar(l, apoderado); });
    cada("data-compartir", function (id, l) { compartir(l, apoderado); });
    cada("data-borrar", function (id, l) {
      if (confirm("¿Borrar \"" + l.titulo + "\" de este celular?")) { borrarLibro(id); apoderado(); }
    });
  }
  function cargarEjemplo() {
    fetch("libros/papelucho-ji.json").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      var v = C.validar(d);
      F = { libro: v.libro, avisos: [] };
      paso4();
    }).catch(function () { alert("No se pudo abrir el ejemplo. Revisa tu conexión e inténtalo otra vez."); });
  }

  /* ===== Paso 1: datos del libro ===== */
  var CANTIDADES = [{ n: 6, t: "Pocos" }, { n: 10, t: "Normal" }, { n: 20, t: "Muchos" }];
  function paso1() {
    var cursos = ["1° básico", "2° básico", "3° básico", "4° básico", "5° básico", "6° básico", "7° básico", "8° básico", "I medio", "II medio", "III medio", "IV medio"];
    pantalla("Preparar un libro", apoderado, pasos(1) +
      '<div class="card" style="--c:var(--accent)"><h2>1. Datos del libro</h2>' +
      '<label class="campo" for="f-tit">Título del libro</label><input class="entrada" id="f-tit" value="' + esc(F.titulo) + '" placeholder="Ej: Mi hermana Ji, por Papelucho">' +
      '<label class="campo" for="f-aut">Autor <small>(opcional)</small></label><input class="entrada" id="f-aut" value="' + esc(F.autor) + '" placeholder="Ej: Marcela Paz">' +
      '<label class="campo" for="f-cur">Curso del alumno</label><select class="entrada" id="f-cur">' +
      cursos.map(function (c) { return '<option' + (c === F.curso ? " selected" : "") + '>' + c + '</option>'; }).join("") + '</select>' +
      '<label class="campo" for="f-cap">¿Qué parte entra en la prueba? <small>(opcional)</small></label><input class="entrada" id="f-cap" value="' + esc(F.capitulos) + '" placeholder="Ej: capítulos 1 al 5, o todo el libro">' +
      '<label class="campo">¿Qué tienes?</label>' +
      '<label class="check"><input type="checkbox" id="f-lib"' + (F.tengoLibro ? " checked" : "") + '> 📖 El libro (PDF o fotos de las páginas)</label>' +
      '<label class="check"><input type="checkbox" id="f-gui"' + (F.tengoGuia ? " checked" : "") + '> 📝 La guía del profesor con las preguntas</label>' +
      '<div id="f-fuentes"></div>' +
      '<label class="campo">¿Cuántos ejercicios por sección?</label>' +
      '<div class="cantidades">' + CANTIDADES.map(function (c) {
        return '<button type="button" class="cant' + (c.n === F.cantidad ? " activa" : "") + '" data-cant="' + c.n + '"><b>' + c.t + '</b><small>' + c.n + '</small></button>';
      }).join("") + '</div><p class="pista" id="f-cant-nota" style="margin-top:6px"></p>' +
      '<button class="btn" id="f-sig">Siguiente ➡️</button></div>');
    function notaCantidad() {
      var n = F.cantidad;
      var t = $("f-gui").checked
        ? "Las preguntas serán las de la guía. Verdadero o falso y completar tendrán " + n + " cada una."
        : "Se crearán " + n + " preguntas, " + n + " de verdadero o falso y " + n + " para completar.";
      if (n >= 20) t += " Si tu IA corta la respuesta, pídele \"continúa\" o elige Normal.";
      $("f-cant-nota").textContent = t;
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-cant]"), function (b) {
      b.onclick = function () {
        F.cantidad = +b.getAttribute("data-cant");
        Array.prototype.forEach.call(document.querySelectorAll("[data-cant]"), function (x) { x.classList.toggle("activa", x === b); });
        notaCantidad();
      };
    });
    $("f-gui").onchange = notaCantidad;
    notaCantidad();
    function fuentes() {
      var sinLibro = !$("f-lib").checked;
      $("f-fuentes").innerHTML = sinLibro
        ? FUENTES + '<div class="caja aviso">Si no consigues el libro, igual puedes seguir. La IA usará lo que sepa del libro y marcará lo que no sea seguro, para que lo revises.</div>'
        : "";
    }
    $("f-lib").onchange = fuentes; fuentes();
    $("f-sig").onclick = function () {
      F.titulo = $("f-tit").value.trim(); F.autor = $("f-aut").value.trim(); F.curso = $("f-cur").value;
      F.capitulos = $("f-cap").value.trim(); F.tengoLibro = $("f-lib").checked; F.tengoGuia = $("f-gui").checked;
      if (!F.titulo) { $("f-tit").focus(); $("f-tit").style.borderColor = "var(--bad)"; return; }
      paso2();
    };
  }

  /* ===== Paso 2: instrucción para la IA ===== */
  function construirPrompt(F) {
    var l = [];
    l.push('Eres un profesor que ayuda a un niño de ' + F.curso + ' a repasar el libro "' + F.titulo + '"' + (F.autor ? ' de ' + F.autor : '') + ' para una evaluación.');
    l.push('');
    l.push('MATERIAL');
    if (F.tengoLibro) l.push('- Te adjunto el libro (o parte de él) en PDF o fotos. Usa SOLO lo que dice ese texto.');
    if (F.tengoGuia) l.push('- También te adjunto la guía del profesor con las preguntas de la evaluación.');
    if (F.capitulos) l.push('- La evaluación cubre: ' + F.capitulos + '.');
    if (!F.tengoLibro) {
      l.push('- No tengo el libro. Usa solo información que conozcas con seguridad o que encuentres en fuentes confiables (resúmenes, reseñas o sitios educativos).');
      l.push('- No inventes detalles de la historia. No busques ni enlaces copias del libro completo.');
    }
    l.push('- Si no puedes leer algún archivo adjunto, dímelo en vez de inventar.');
    l.push('');
    l.push('TAREA');
    var n = F.cantidad || 10;
    if (F.tengoGuia) l.push('1. "preguntas": usa exactamente las preguntas de la guía, en el mismo orden, sin agregar otras.');
    else l.push('1. "preguntas": crea ' + n + ' preguntas importantes sobre la historia (personajes, hechos principales, causas y consecuencias), sin repetir ideas.');
    l.push('   Para cada pregunta escribe:');
    l.push('   - "titulo": de 1 a 3 palabras (ej: "La cocina").');
    l.push('   - "icono": un solo emoji que la represente.');
    l.push('   - "respuesta": de 2 a 4 frases cortas y simples, que un niño de ' + F.curso + ' pueda decir con sus palabras.');
    l.push('   - "correcta": la respuesta correcta en una frase breve.');
    l.push('   - "incorrectas": 2 respuestas falsas pero creíbles, de largo parecido a la correcta.');
    l.push('2. "verdaderoFalso": exactamente ' + n + ' frases en total, repartidas entre las preguntas, mitad verdaderas y mitad falsas. Cada una con una "explicacion" de una frase. En "pregunta" pon el número de la pregunta relacionada.');
    l.push('3. "completar": exactamente ' + n + ' oraciones en total, repartidas entre las preguntas. Marca cada palabra que falta con ___ (tres guiones bajos), con 1 a 3 espacios por oración. En "respuestas" pon las palabras que faltan, en orden, una palabra por espacio. En "distractores" pon 2 palabras parecidas que NO correspondan.');
    if (n >= 20) l.push('Si la respuesta no te cabe completa, termina el bloque JSON correctamente y avísame para pedirte el resto.');
    l.push('');
    l.push('REGLAS');
    l.push('- Lenguaje simple y frases cortas, adecuadas para ' + F.curso + '.');
    l.push('- En cada elemento pon "seguro": true si lo confirmaste' + (F.tengoLibro ? ' en el texto' : ' en una fuente confiable') + ', o "seguro": false si no estás completamente seguro.');
    l.push('- Responde SOLO con un bloque de código JSON, sin texto antes ni después, con esta estructura:');
    l.push('');
    l.push('```json');
    l.push(JSON.stringify({
      titulo: F.titulo, autor: F.autor || "...", curso: F.curso, modo: F.tengoGuia ? "guia" : "libro",
      preguntas: [{ titulo: "...", icono: "🔑", pregunta: "...", respuesta: "...", correcta: "...", incorrectas: ["...", "..."], seguro: true }],
      verdaderoFalso: [{ frase: "...", esVerdadera: true, explicacion: "...", pregunta: 1, seguro: true }],
      completar: [{ frase: "La ___ lavó toda la ___.", respuestas: ["...", "..."], distractores: ["...", "..."], pregunta: 1, seguro: true }]
    }, null, 2));
    l.push('```');
    return l.join("\n");
  }
  function paso2() {
    var prompt = construirPrompt(F);
    var adjuntar = [];
    if (F.tengoLibro) adjuntar.push("el libro (PDF o fotos)");
    if (F.tengoGuia) adjuntar.push("la guía del profesor");
    pantalla("Preparar un libro", paso1, pasos(2) +
      '<div class="card" style="--c:var(--accent)"><h2>2. Pídeselo a tu IA</h2>' +
      '<div class="caja info"><ol>' +
      '<li>Toca <b>Copiar instrucción</b>.</li>' +
      '<li>Abre tu IA (ChatGPT, Gemini, Claude u otra) y <b>pega</b> la instrucción.</li>' +
      (adjuntar.length ? '<li><b>Adjunta</b> ' + adjuntar.join(" y ") + '.</li>' : '') +
      '<li>Envíala y espera la respuesta.</li></ol></div>' +
      '<button class="btn" id="p-copiar">📋 Copiar instrucción</button>' +
      (F.tengoLibro ? '<div class="caja aviso">Si tu IA no logra leer el PDF, envíale fotos de las páginas, de a 10 o menos.</div>' : '') +
      '<details style="margin-top:14px"><summary style="cursor:pointer;color:var(--muted)">Ver o editar la instrucción</summary>' +
      '<textarea class="entrada" id="p-texto" style="margin-top:8px;min-height:260px">' + esc(prompt) + '</textarea></details>' +
      '<button class="btn alt" id="p-sig">Ya tengo la respuesta ➡️</button></div>');
    $("p-copiar").onclick = function () { copiar($("p-texto").value, this, "📋 Copiar instrucción"); };
    $("p-sig").onclick = function () { paso3(); };
  }

  /* ===== Paso 3: pegar la respuesta ===== */
  function paso3(desdeArchivo) {
    pantalla(desdeArchivo ? "Cargar archivo" : "Preparar un libro", desdeArchivo ? apoderado : paso2, (desdeArchivo ? "" : pasos(3)) +
      '<div class="card" style="--c:var(--accent)"><h2>' + (desdeArchivo ? "Cargar contenido" : "3. Pega la respuesta de la IA") + '</h2>' +
      '<p class="pista">' + (desdeArchivo
        ? 'Elige el archivo .json que te enviaron, o pega su contenido.'
        : 'En la respuesta de la IA, toca el botón <b>Copiar</b> del bloque de código y pégalo aquí.') + '</p>' +
      '<textarea class="entrada" id="r-texto" placeholder="Pega aquí la respuesta…"></textarea>' +
      '<div class="fila"><button class="btn suave" id="r-pegar">📋 Pegar</button>' +
      '<button class="btn suave" id="r-archivo">📂 Elegir archivo</button></div>' +
      '<input type="file" id="r-file" accept=".json,application/json,text/plain" style="display:none">' +
      '<div id="r-msj"></div><button class="btn" id="r-rev">Revisar ✔️</button></div>');
    $("r-pegar").onclick = function () {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (t) { $("r-texto").value = t; }, function () { $("r-texto").focus(); });
      } else $("r-texto").focus();
    };
    $("r-archivo").onclick = function () { $("r-file").click(); };
    $("r-file").onchange = function () {
      var f = this.files[0]; if (!f) return;
      var lector = new FileReader();
      lector.onload = function () { $("r-texto").value = lector.result; };
      lector.readAsText(f);
    };
    $("r-rev").onclick = function () {
      var datos;
      try { datos = C.extraerJSON($("r-texto").value); }
      catch (e) { $("r-msj").innerHTML = '<div class="caja error">' + esc(e.message) + '</div>'; return; }
      var v = C.validar(datos);
      if (v.errores.length) { $("r-msj").innerHTML = '<div class="caja error">' + v.errores.map(esc).join("<br>") + '</div>'; return; }
      F = F || {};
      F.libro = v.libro; F.avisos = v.avisos; F.id = null;
      paso4();
    };
  }
  function importar() { F = {}; paso3(true); }

  /* ===== Paso 4: vista previa ===== */
  function paso4() {
    var L = F.libro;
    var dudas = 0;
    function marca(x) { if (x.seguro === false) dudas++; return x.seguro === false ? " duda" : ""; }
    function quitar(tipo, i) { return '<button class="mini" data-quitar="' + tipo + ':' + i + '" aria-label="Quitar">🗑️</button>'; }
    var h = '<h3>Preguntas (' + L.preguntas.length + ')</h3>';
    L.preguntas.forEach(function (p, i) {
      h += '<div class="item' + marca(p) + '"><div class="txt"><b>' + (i + 1) + '. ' + esc(p.icono) + ' ' + esc(p.titulo) + '</b><br>' + esc(p.pregunta) +
        '<br><span class="etq v">Respuesta</span>' + esc(p.respuesta) +
        (p.correcta ? '<br><span class="etq v">Correcta</span>' + esc(p.correcta) : "") +
        p.incorrectas.map(function (t) { return '<br><span class="etq f">Incorrecta</span>' + esc(t); }).join("") +
        (p.seguro === false ? '<br><span class="etq d">⚠️ Revisar</span>' : "") + '</div>' + quitar("p", i) + '</div>';
    });
    h += '<h3>Verdadero o falso (' + L.verdaderoFalso.length + ')</h3>';
    L.verdaderoFalso.forEach(function (x, i) {
      h += '<div class="item' + marca(x) + '"><div class="txt"><span class="etq ' + (x.esVerdadera ? "v" : "f") + '">' + (x.esVerdadera ? "V" : "F") + '</span>' +
        esc(x.frase) + (x.explicacion ? '<br><small>' + esc(x.explicacion) + '</small>' : "") +
        (x.seguro === false ? '<br><span class="etq d">⚠️ Revisar</span>' : "") + '</div>' + quitar("v", i) + '</div>';
    });
    h += '<h3>Completar (' + L.completar.length + ')</h3>';
    L.completar.forEach(function (x, i) {
      var k = 0;
      var f = esc(x.frase).replace(/___/g, function () { return '<b style="color:var(--ok)">[' + esc(x.respuestas[k++]) + ']</b>'; });
      h += '<div class="item' + marca(x) + '"><div class="txt">' + f +
        (x.distractores.length ? '<br><small>Distractores: ' + esc(x.distractores.join(", ")) + '</small>' : "") +
        (x.seguro === false ? '<br><span class="etq d">⚠️ Revisar</span>' : "") + '</div>' + quitar("c", i) + '</div>';
    });
    var arriba = '<div class="card" style="--c:var(--accent)"><h2>📘 ' + esc(L.titulo) + '</h2><p class="pista">' + esc(resumen(L)) + '</p>';
    if (dudas) arriba += '<div class="caja aviso">⚠️ <b>' + dudas + (dudas === 1 ? " elemento" : " elementos") + ' para revisar.</b> La IA no estaba segura. Revísalos con el libro o quítalos con 🗑️.</div>';
    else arriba += '<div class="caja ok">✅ La IA marcó todo como seguro. Igual dale una mirada rápida.</div>';
    if (F.avisos && F.avisos.length) arriba += '<div class="caja aviso"><b>Notas:</b><ul>' + F.avisos.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join("") + '</ul></div>';
    arriba += '<button class="btn alt" id="v-probar">▶️ Probar como alumno</button><button class="btn" id="v-guardar">💾 Guardar y compartir</button>' +
      (F.id ? '<button class="btn peligro" id="v-borrar">Borrar este libro</button>' : "") + '</div>';
    pantalla("Vista previa", apoderado, (F.id ? "" : pasos(4)) + arriba + '<div class="card" style="--c:#ddd">' + h + '</div>');

    Array.prototype.forEach.call(document.querySelectorAll("[data-quitar]"), function (b) {
      b.onclick = function () {
        var d = b.getAttribute("data-quitar").split(":"), i = +d[1];
        if (d[0] === "p") quitarPregunta(i);
        else if (d[0] === "v") L.verdaderoFalso.splice(i, 1);
        else L.completar.splice(i, 1);
        if (F.id) guardarLibro(L, F.id);
        paso4();
      };
    });
    $("v-probar").onclick = function () { jugar(L, paso4); };
    $("v-guardar").onclick = function () {
      var id = guardarLibro(L, F.id);
      if (!id) { alert("No se pudo guardar en este celular, pero igual puedes compartirlo."); }
      else F.id = id;
      compartir(L, apoderado);
    };
    if (F.id) $("v-borrar").onclick = function () {
      if (confirm("¿Borrar \"" + L.titulo + "\" de este celular?")) { borrarLibro(F.id); apoderado(); }
    };
  }
  function quitarPregunta(i) {
    var L = F.libro, n = i + 1;
    L.preguntas.splice(i, 1);
    [L.verdaderoFalso, L.completar].forEach(function (arr) {
      arr.forEach(function (x) { if (x.pregunta === n) x.pregunta = null; else if (x.pregunta > n) x.pregunta--; });
    });
  }

  /* ===== Compartir ===== */
  function htmlAlumno(L) {
    var archivos = ["css/estilos.css", "js/comun.js", "js/juego.js"];
    return Promise.all(archivos.map(function (u) {
      return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.text(); });
    })).then(function (t) {
      var datos = JSON.stringify(C.limpio(L)).replace(/</g, "\\u003c");
      return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
        '<meta name="theme-color" content="#ff7a59">\n<title>' + esc(L.titulo) + '</title>\n<style>\n' + t[0] + '\n</style>\n</head>\n<body>\n' +
        '<div id="app"><main class="zona"><div class="card center" style="--c:#ff7a59"><div style="font-size:44px">📱</div>' +
        '<p><b>Abre este archivo con Google Chrome.</b></p><p>Mantén presionado el archivo → <b>Abrir con</b> → <b>Chrome</b>.</p></div></main></div>\n' +
        '<script>window.LIBRO=' + datos + ';<\/script>\n<script>\n' + t[1] + '\n<\/script>\n<script>\n' + t[2] + '\n<\/script>\n' +
        '<script>Juego.iniciar(window.LIBRO, document.getElementById("app"), {});<\/script>\n</body>\n</html>\n';
    });
  }
  function compartir(L, volver) {
    pantalla("Compartir", volver,
      '<div class="card" style="--c:var(--accent)"><h2>📤 ' + esc(L.titulo) + '</h2>' +
      '<p class="pista">Elige cómo entregarle el material al alumno.</p>' +
      '<button class="btn" id="s-html">📄 Descargar archivo para el alumno</button>' +
      '<p class="pista" style="margin-top:6px">Funciona sin internet. Envíalo por WhatsApp o Quick Share.</p>' +
      '<button class="btn alt" id="s-link">🔗 Copiar enlace</button>' +
      '<p class="pista" style="margin-top:6px">Se abre directo en el navegador (necesita internet la primera vez).</p>' +
      '<button class="btn suave" id="s-json">💾 Descargar respaldo (para otro apoderado)</button>' +
      '<div id="s-msj"></div>' +
      '<div class="caja aviso">📱 En el celular del alumno, abre el archivo con <b>Chrome</b>: mantén presionado → <b>Abrir con</b> → <b>Chrome</b> → <b>Siempre</b>.</div></div>');
    var nombre = nombreArchivo(L.titulo);
    $("s-html").onclick = function () {
      var b = this; b.disabled = true;
      htmlAlumno(L).then(function (h) { descargar(nombre + ".html", h, "text/html"); b.disabled = false; })
        .catch(function () { b.disabled = false; $("s-msj").innerHTML = '<div class="caja error">No se pudo crear el archivo. Abre la app con internet una vez y vuelve a intentarlo.</div>'; });
    };
    $("s-link").onclick = function () {
      var b = this;
      C.comprimir(C.limpio(L)).then(function (z) {
        var url = location.origin + location.pathname + "#d=" + z;
        copiar(url, b, "🔗 Copiar enlace");
        if (url.length > 6000) $("s-msj").innerHTML = '<div class="caja aviso">El enlace quedó largo. Si no se abre bien, usa mejor el archivo.</div>';
      });
    };
    $("s-json").onclick = function () { descargar(nombre + ".json", JSON.stringify(C.limpio(L), null, 2), "application/json"); };
  }

  /* ===== Enlace compartido (#d=...) ===== */
  function abrirEnlace(codigo) {
    C.descomprimir(codigo).then(function (d) {
      var v = C.validar(d);
      if (!v.libro || v.errores.length) throw new Error();
      history.replaceState(null, "", location.pathname);
      jugar(v.libro, inicio, function (boton) {
        var ok = guardarLibro(v.libro);
        boton.textContent = ok ? "✅ Guardado en Mis libros" : "No se pudo guardar";
        boton.disabled = true;
      });
    }).catch(function () {
      pantalla("Repaso de lectura", inicio, '<div class="caja error">El enlace está incompleto o dañado. Pide que te lo envíen otra vez, o usa el archivo.</div>');
    });
  }

  /* ===== Arranque ===== */
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () { /* sin conexión al registrar */ });
  }
  var h = location.hash;
  if (h.indexOf("#d=") === 0) abrirEnlace(h.slice(3)); else inicio();
})();
