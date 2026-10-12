# Repaso de lectura 📚

App web para que los alumnos repasen los libros del colegio con preguntas, juegos y voz.
Funciona en el celular, se puede instalar y sirve sin internet.

## Cómo funciona

**Apoderado**
1. Llena los datos del libro y marca qué tiene: el libro, la guía del profesor o ambos.
2. Copia la instrucción y la pega en su IA (ChatGPT, Gemini, Claude u otra), adjuntando el material.
3. Copia la respuesta de la IA y la pega en la app.
4. Revisa la vista previa. Lo que la IA no confirmó aparece marcado con ⚠️.
5. Comparte con el alumno: un archivo HTML que funciona sin internet, un enlace o un respaldo `.json`.

**Alumno**
Abre el archivo o el enlace y juega en cuatro secciones: alternativas, verdadero o falso, completar la oración y tirar el dado. Todo con voz.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub, por ejemplo `repaso-lectura`.
2. Sube todos los archivos de esta carpeta, incluido `.nojekyll`.
3. En el repositorio entra a **Settings → Pages**.
4. En **Source** elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`, y guarda.
5. En uno o dos minutos la app queda en `https://TU-USUARIO.github.io/repaso-lectura/`.

Para probarla en el computador sin publicarla:

```
python3 -m http.server
```

y abre `http://localhost:8000`.

## Estructura

```
index.html          Pantalla principal
css/estilos.css     Diseño
js/comun.js         Voz, lectura y validación del contenido
js/juego.js         Motor de las 4 secciones (también va dentro del HTML del alumno)
js/app.js           Inicio, sección apoderado y sección alumno
libros/             Libros de ejemplo en formato JSON
icons/              Íconos de la app
manifest.json       Datos para instalarla en el celular
sw.js               Permite usarla sin internet
```

Si cambias algún archivo, sube el número de `VERSION` en `sw.js` para que los celulares descarguen la versión nueva.

## Formato del contenido

```json
{
  "titulo": "Mi hermana Ji, por Papelucho",
  "autor": "Marcela Paz",
  "curso": "5° básico",
  "modo": "guia",
  "preguntas": [
    { "titulo": "La casa", "icono": "🔑", "pregunta": "...", "respuesta": "...",
      "correcta": "...", "incorrectas": ["...", "..."], "seguro": true }
  ],
  "verdaderoFalso": [
    { "frase": "...", "esVerdadera": true, "explicacion": "...", "pregunta": 1, "seguro": true }
  ],
  "completar": [
    { "frase": "La Ji lavó la ___ con la ___.", "respuestas": ["cocina", "manguera"],
      "distractores": ["pieza", "escoba"], "pregunta": 1, "seguro": true }
  ]
}
```

- `modo`: `"guia"` cuando las preguntas vienen de la guía del profesor, `"libro"` cuando las creó la IA.
- `pregunta`: número de la pregunta relacionada (da el color y el ícono). Es opcional.
- `seguro`: `false` marca el elemento con ⚠️ en la vista previa.
- En `completar`, cada `___` es un espacio y lleva una palabra en `respuestas`, en orden.

## Dónde conseguir los libros

- [Biblioteca Digital Escolar](https://bdescolar.mineduc.cl) (Mineduc): gratis para alumnos de colegios municipales y subvencionados.
- [Biblioteca Pública Digital](https://www.bpdigital.cl): gratis para quien se inscriba.

## Nota para el celular del alumno

Los archivos HTML deben abrirse con **Google Chrome**. Algunos visores de Android (por ejemplo, al abrir desde Quick Share o WhatsApp) no ejecutan la app y solo muestran el encabezado.
Mantén presionado el archivo → **Abrir con** → **Chrome** → **Siempre**.
