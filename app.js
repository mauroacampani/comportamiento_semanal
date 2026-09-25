/* ==========================================================
   Mi cuadro de comportamiento — lógica (vanilla JS)
   - Estado por día, autoguardado en localStorage
   - Wizard 1 aspecto por pantalla (9 pasos)
   - Sin frameworks, sin sonidos
   ========================================================== */
(function () {
  "use strict";

  var CLAVE = "miCuadro.v1";

  var DAYS = [
    { id: "lunes", label: "Lunes", emoji: "🌞" },
    { id: "martes", label: "Martes", emoji: "🌈" },
    { id: "miercoles", label: "Miércoles", emoji: "⭐" },
    { id: "jueves", label: "Jueves", emoji: "🌻" },
    { id: "viernes", label: "Viernes", emoji: "🎉" },
    { id: "sabado", label: "Sábado", emoji: "❤️" },
    { id: "domingo", label: "Domingo", emoji: "🌙" }
  ];

  var ASPECTS = [
    { id: "escuela", name: "Escuela", emoji: "🏫" },
    { id: "docente", name: "Docente", emoji: "👩‍🏫" },
    { id: "companeros", name: "Compañeros", emoji: "🧒" },
    { id: "mama", name: "Mamá", emoji: "👩" },
    { id: "abuela", name: "Abuela", emoji: "👵" },
    { id: "futbol", name: "Fútbol", emoji: "⚽" },
    { id: "paseos", name: "Paseos", emoji: "🚶" }
  ];

  var FACES = [
    { id: "muy-bien", emoji: "😊", name: "Muy bien", desc: "Estuve tranquilo y respeté las reglas." },
    { id: "bien", emoji: "🙂", name: "Bien", desc: "Me costó un poquito, pero pude hacerlo bien." },
    { id: "a-mejorar", emoji: "😐", name: "A mejorar", desc: "Tuve alguna dificultad y necesito intentarlo de nuevo." },
    { id: "me-costo", emoji: "😟", name: "Me costó", desc: "Me sentí mal o tuve una conducta que debo mejorar." },
    { id: "me-enoje", emoji: "😡", name: "Me enojé", desc: "Sentí mucho enojo y me costó controlar mi reacción." }
  ];

  var CALM = [
    { id: "solo", emoji: "😊", label: "Sí, pude hacerlo solo." },
    { id: "con-ayuda", emoji: "🙂", label: "Sí, con ayuda de un adulto." },
    { id: "intente", emoji: "😐", label: "Me costó, pero lo intenté." },
    { id: "no-pude", emoji: "😡", label: "No pude calmarme." }
  ];

  var STRATEGIES = [
    { id: "respirar", emoji: "🫁", label: "Respiré profundo" },
    { id: "tranquilo", emoji: "🧘", label: "Me quedé tranquilo un momento" },
    { id: "hablar", emoji: "🗣️", label: "Hablé con un adulto" },
    { id: "alejar", emoji: "🚶", label: "Me alejé un poquito" },
    { id: "ayuda", emoji: "🤝", label: "Pedí ayuda" },
    { id: "otra", emoji: "✏️", label: "Otra" }
  ];

  var TOTAL_PASOS = ASPECTS.length + 2; // 7 aspectos + enojo + logro = 9

  /* ---------- Estado ---------- */
  function diaVacio() {
    return { aspectos: {}, calma: null, estrategias: [], otraEstrategia: "", orgullo: "", manana: "" };
  }
  function estadoInicial() {
    var dias = {};
    DAYS.forEach(function (d) { dias[d.id] = diaVacio(); });
    return { nombre: "", semana: "", dias: dias };
  }

  var state = estadoInicial();
  var ui = { vista: "hoy", dia: diaDeHoy(), paso: 0 };
  var timerSave = null;

  function diaDeHoy() {
    var n = new Date().getDay(); // 0 dom … 6 sáb
    var mapa = { 1: "lunes", 2: "martes", 3: "miercoles", 4: "jueves", 5: "viernes", 6: "sabado", 0: "domingo" };
    return mapa[n] || "lunes";
  }
  function diaLabel(id) {
    var d = DAYS.find(function (x) { return x.id === id; });
    return d ? d.label : id;
  }
  function aspectoDef(id) {
    return ASPECTS.find(function (a) { return a.id === id; });
  }
  function faceDef(id) {
    return FACES.find(function (f) { return f.id === id; });
  }
  function calmDef(id) {
    return CALM.find(function (c) { return c.id === id; });
  }
  function stratDef(id) {
    return STRATEGIES.find(function (s) { return s.id === id; });
  }

  /* ---------- Persistencia ---------- */
  function cargar() {
    try {
      var raw = localStorage.getItem(CLAVE);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object" || !data.dias) return;
      state.nombre = typeof data.nombre === "string" ? data.nombre : "";
      state.semana = typeof data.semana === "string" ? data.semana : "";
      DAYS.forEach(function (d) {
        var g = data.dias[d.id] || {};
        var base = diaVacio();
        base.aspectos = (g.aspectos && typeof g.aspectos === "object") ? g.aspectos : {};
        base.calma = typeof g.calma === "string" ? g.calma : null;
        base.estrategias = Array.isArray(g.estrategias) ? g.estrategias.filter(function (x) { return typeof x === "string"; }) : [];
        base.otraEstrategia = typeof g.otraEstrategia === "string" ? g.otraEstrategia : "";
        base.orgullo = typeof g.orgullo === "string" ? g.orgullo : "";
        base.manana = typeof g.manana === "string" ? g.manana : "";
        state.dias[d.id] = base;
      });
    } catch (e) { /* localStorage no disponible: la app sigue funcionando en memoria */ }
  }
  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(state));
      var el = document.getElementById("guardado");
      if (el) el.textContent = "✓ Guardado automático";
    } catch (e) { /* sin almacenamiento: no se interrumpe */ }
  }
  function guardarDebounced() {
    clearTimeout(timerSave);
    timerSave = setTimeout(guardar, 350);
  }

  /* ---------- Utilidades ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function $ (id) { return document.getElementById(id); }
  function anunciar(msg) {
    var el = $("anuncio");
    if (el) { el.textContent = ""; setTimeout(function () { el.textContent = msg; }, 30); }
  }
  function reduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function aspectosCompletos(diaId) {
    var d = state.dias[diaId];
    return ASPECTS.filter(function (a) { return d.aspectos[a.id] != null; }).length;
  }
  function progresoDia(diaId) {
    var d = state.dias[diaId];
    var n = aspectosCompletos(diaId);
    var total = n;
    var max = TOTAL_PASOS;
    if (d.calma) total += 1;
    if ((d.orgullo || "").trim() || (d.manana || "").trim()) total += 1;
    return { hechos: total, total: max };
  }
  function estadoDia(diaId) {
    var p = progresoDia(diaId);
    if (p.hechos >= p.total) return { txt: "✅ Completo", cls: "ok" };
    if (p.hechos > 0) return { txt: "◐ En curso", cls: "curso" };
    return { txt: "○ Sin empezar", cls: "" };
  }

  /* ---------- Render: selector de días ---------- */
  function renderDias() {
    var cont = $("dias");
    cont.innerHTML = DAYS.map(function (d) {
      var est = estadoDia(d.id);
      var sel = ui.dia === d.id ? " seleccionado" : "";
      var comp = progresoDia(d.id).hechos >= TOTAL_PASOS ? " completo" : "";
      var checked = ui.dia === d.id ? " checked" : "";
      return (
        '<label class="dia' + sel + comp + '">' +
          '<input type="radio" name="dia" value="' + d.id + '"' + checked +
          ' aria-label="' + esc(d.label) + ", " + esc(est.txt) + '">' +
          '<span class="dia-emoji" aria-hidden="true">' + d.emoji + "</span>" +
          '<span class="dia-txt"><span class="dia-nombre">' + esc(d.label) + "</span>" +
          '<span class="dia-estado">' + esc(est.txt) + "</span></span>" +
        "</label>"
      );
    }).join("");
  }

  /* ---------- Render: paso actual ---------- */
  function renderPaso(enfocar) {
    var cont = $("paso-contenido");
    var diaId = ui.dia;
    var data = state.dias[diaId];
    var html = "";

    if (ui.paso < ASPECTS.length) {
      var asp = ASPECTS[ui.paso];
      var actual = data.aspectos[asp.id] || null;
      html +=
        '<p class="paso-titulo"><span aria-hidden="true">' + asp.emoji + "</span> " + esc(asp.name) + "</p>" +
        '<p class="paso-ayuda" id="ayuda-paso">Paso ' + (ui.paso + 1) + " de " + TOTAL_PASOS +
        " · " + esc(diaLabel(diaId)) + ': ¿cómo estuviste en <strong>' + esc(asp.name.toLowerCase()) +
        "</strong>? Toca una carita.</p>" +
        '<div class="leyenda">🎭 <strong>Mis caritas:</strong> 😊 Muy bien · 🙂 Bien · 😐 A mejorar · 😟 Me costó · 😡 Me enojé</div>' +
        '<fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">' + esc(asp.name) + " el " +
        esc(diaLabel(diaId)) + ': elige una carita</legend><div class="caritas" role="presentation">' +
        FACES.map(function (f) {
          var sel = actual === f.id ? " seleccionada" : "";
          var chk = actual === f.id ? " checked" : "";
          return (
            '<label class="carita' + sel + '">' +
              '<input type="radio" name="face-' + asp.id + '" value="' + f.id + '"' + chk +
              ' aria-label="' + esc(asp.name + " el " + diaLabel(diaId) + ": " + f.name + ". " + f.desc) + '">' +
              '<span class="emoji" aria-hidden="true">' + f.emoji + "</span>" +
              '<span class="txt"><span class="nombre">' + esc(f.name) + "</span>" +
              '<span class="desc">' + esc(f.desc) + "</span></span>" +
              '<span class="check" aria-hidden="true">✓</span>' +
            "</label>"
          );
        }).join("") +
        '<label class="carita no-aplica' + (actual === "no-aplica" ? " seleccionada" : "") + '">' +
          '<input type="radio" name="face-' + asp.id + '" value="no-aplica"' + (actual === "no-aplica" ? " checked" : "") +
          ' aria-label="' + esc(asp.name + " el " + diaLabel(diaId) + ": hoy no hubo, no aplica") + '">' +
          '<span class="emoji" aria-hidden="true">➖</span>' +
          '<span class="txt"><span class="nombre">Hoy no hubo</span>' +
          '<span class="desc">No aplica este día (ej.: escuela el fin de semana).</span></span>' +
          '<span class="check" aria-hidden="true">✓</span>' +
        "</label></div></fieldset>";
    } else if (ui.paso === ASPECTS.length) {
      // Paso enojo
      html +=
        '<p class="paso-titulo">🧘 Cuando me enojo…</p>' +
        '<p class="paso-ayuda">Paso ' + (ui.paso + 1) + " de " + TOTAL_PASOS + " · " + esc(diaLabel(diaId)) +
        ". Enojarse está bien. Contar qué pasó te ayuda a calmarte.</p>" +
        '<fieldset style="border:0;padding:0;margin:0 0 1rem"><legend><strong>¿Pude calmarme? Elige una opción.</strong></legend>' +
        '<div class="opciones">' +
        CALM.map(function (c) {
          var sel = data.calma === c.id ? " seleccionada" : "";
          var chk = data.calma === c.id ? " checked" : "";
          return (
            '<label class="opcion' + sel + '">' +
              '<input type="radio" name="calma" value="' + c.id + '"' + chk +
              ' aria-label="¿Pude calmarme? ' + esc(c.label) + '">' +
              '<span class="emoji" aria-hidden="true">' + c.emoji + "</span>" +
              "<span>" + esc(c.label) + "</span>" +
            "</label>"
          );
        }).join("") + "</div></fieldset>" +
        '<fieldset style="border:0;padding:0;margin:0"><legend><strong>¿Qué hice para tranquilizarme? Puedes elegir varias.</strong></legend>' +
        '<div class="opciones">' +
        STRATEGIES.map(function (s) {
          if (s.id === "otra") {
            var on = data.estrategias.indexOf("otra") !== -1;
            return (
              '<div class="otra-fila"><label class="opcion' + (on ? " seleccionada" : "") + '">' +
                '<input type="checkbox" name="est" value="otra"' + (on ? " checked" : "") +
                ' aria-label="Otra estrategia">' +
                '<span class="emoji" aria-hidden="true">✏️</span><span>Otra:</span>' +
              "</label>" +
              '<input type="text" id="otra-texto" maxlength="80" placeholder="Escribe qué hiciste…" value="' +
              esc(data.otraEstrategia) + '"' + (on ? "" : " disabled") +
              ' aria-label="Describe otra estrategia para tranquilizarte"></div>'
            );
          }
          var has = data.estrategias.indexOf(s.id) !== -1;
          return (
            '<label class="opcion' + (has ? " seleccionada" : "") + '">' +
              '<input type="checkbox" name="est" value="' + s.id + '"' + (has ? " checked" : "") +
              ' aria-label="' + esc(s.label) + '">' +
              '<span class="emoji" aria-hidden="true">' + s.emoji + "</span>" +
              "<span>" + esc(s.label) + "</span>" +
            "</label>"
          );
        }).join("") + "</div></fieldset>";
    } else {
      // Paso logro
      html +=
        '<div class="logro"><p class="paso-titulo">🏆 Mi logro de hoy</p>' +
        '<p class="paso-ayuda">Paso ' + (ui.paso + 1) + " de " + TOTAL_PASOS + " · " + esc(diaLabel(diaId)) +
        ". Algo bueno que hiciste o intentaste. 🌈</p>" +
        '<label for="input-orgullo">Hoy me sentí orgulloso/a porque…</label>' +
        '<textarea id="input-orgullo" rows="3" maxlength="400" placeholder="Ej.: respiré antes de enojarme…">' +
        esc(data.orgullo) + "</textarea>" +
        '<label for="input-manana">Mañana voy a intentar…</label>' +
        '<textarea id="input-manana" rows="3" maxlength="400" placeholder="Ej.: pedir ayuda cuando me cueste…">' +
        esc(data.manana) + "</textarea>" +
        '<div class="celebracion">🌈 Cada día puedo aprender y mejorar. ¡Bien por registrar tu día! 🎉</div></div>';
    }

    cont.innerHTML = html;

    // Puntos + botones
    var puntos = $("puntos");
    puntos.innerHTML = Array.from({ length: TOTAL_PASOS }, function (_, i) {
      var cls = "punto";
      if (i === ui.paso) cls += " actual";
      else if (i < ui.paso) cls += " hecho";
      return '<span class="' + cls + '"></span>';
    }).join("");
    $("btn-atras").disabled = ui.paso === 0;
    $("btn-siguiente").textContent = ui.paso === TOTAL_PASOS - 1 ? "Ver mi semana 🎉" : "Siguiente →";

    actualizarProgreso();

    if (enfocar) {
      var t = cont.querySelector(".paso-titulo");
      if (t) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: false }); }
    }
  }

  function actualizarProgreso() {
    var p = progresoDia(ui.dia);
    var pct = Math.round((p.hechos / p.total) * 100);
    $("progreso-texto").textContent = "Paso " + (ui.paso + 1) + " de " + TOTAL_PASOS;
    $("progreso-relleno").style.width = pct + "%";
    var barra = $("progreso-barra");
    barra.setAttribute("aria-valuenow", String(pct));
    barra.setAttribute("aria-label", "Progreso del " + diaLabel(ui.dia) + ": " + p.hechos + " de " + p.total);
    $("progreso-dia").textContent = diaLabel(ui.dia) + ": " + p.hechos + " de " + p.total + " completos 🌈";
  }

  // NOTA: no hay avance automático. Solo los botones Atrás/Siguiente
  // cambian de paso, para que un clic = un paso (más predecible).
  function irPaso(n, enfocar) {
    ui.paso = Math.max(0, Math.min(TOTAL_PASOS - 1, n));
    renderPaso(enfocar !== false);
  }

  /* ---------- Render: semana ---------- */
  function renderSemana() {
    var grid = $("semana-grid");
    grid.innerHTML = DAYS.map(function (d) {
      var data = state.dias[d.id];
      var est = estadoDia(d.id);
      var minis = ASPECTS.map(function (a) {
        var v = data.aspectos[a.id];
        if (!v) return '<span title="' + esc(a.name) + ': sin registrar">·</span>';
        if (v === "no-aplica") return '<span title="' + esc(a.name) + ': no hubo">—</span>';
        var f = faceDef(v);
        return '<span title="' + esc(a.name + ": " + (f ? f.name : v)) + '">' + (f ? f.emoji : "·") + "</span>";
      }).join("");
      var calmaTxt = data.calma && calmDef(data.calma) ? calmDef(data.calma).label : "Sin registrar";
      var logroTxt = (data.orgullo || "").trim()
        ? "🏆 " + esc(data.orgullo.slice(0, 80)) + (data.orgullo.length > 80 ? "…" : "")
        : "Aún sin logro escrito.";
      return (
        '<article class="dia-card"><h3>' + d.emoji + " " + esc(d.label) + "</h3>" +
        '<div class="mini-caritas" aria-hidden="true">' + minis + "</div>" +
        '<p class="estado ' + est.cls + '">' + esc(est.txt) + "</p>" +
        "<p><strong>Calma:</strong> " + esc(calmaTxt) + "</p>" +
        "<p>" + logroTxt + "</p>" +
        '<button type="button" class="btn btn-sec" data-dia="' + d.id + '">' +
        (est.txt.indexOf("Sin") === 0 ? "Completar " + esc(d.label) + " →" : "Ver / cambiar " + esc(d.label) + " →") +
        "</button></article>"
      );
    }).join("");
  }

  /* ---------- Render: resumen ---------- */
  function renderResumen() {
    var box = $("resumen-contenido");
    var nombre = (state.nombre || "").trim() || "Sin nombre";
    var semana = (state.semana || "").trim() || "Sin semana indicada";
    $("resumen-sub").textContent = nombre + " · " + semana + ". Aquí se ve toda tu semana. 😊";

    var tabla =
      '<div class="tabla-wrap"><table class="resumen"><caption>Caritas elegidas por día y aspecto</caption><thead><tr>' +
      '<th class="aspecto" scope="col">Aspecto</th>' +
      DAYS.map(function (d) { return '<th scope="col">' + d.emoji + "<br>" + esc(d.label) + "</th>"; }).join("") +
      "</tr></thead><tbody>" +
      ASPECTS.map(function (a) {
        return '<tr><td class="aspecto">' + a.emoji + " " + esc(a.name) + "</td>" +
          DAYS.map(function (d) {
            var v = state.dias[d.id].aspectos[a.id];
            if (!v) return '<td><span class="celda-vacia" title="Sin registrar">·</span><span class="sr-only">' +
              esc(a.name + " el " + d.label + ": sin registrar") + "</span></td>";
            if (v === "no-aplica") return '<td><span title="No hubo">—</span><span class="sr-only">' +
              esc(a.name + " el " + d.label + ": no hubo") + "</span></td>";
            var f = faceDef(v);
            return '<td><span class="celda-emoji" aria-hidden="true">' + (f ? f.emoji : "?") + "</span>" +
              '<span class="sr-only">' + esc(a.name + " el " + d.label + ": " + (f ? f.name : v)) + "</span></td>";
          }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";

    var detalles = DAYS.map(function (d) {
      var data = state.dias[d.id];
      var calma = data.calma && calmDef(data.calma)
        ? calmDef(data.calma).emoji + " " + esc(calmDef(data.calma).label)
        : "Sin registrar";
      var ests = data.estrategias.map(function (id) {
        if (id === "otra") {
          var t = (data.otraEstrategia || "").trim();
          return "✏️ Otra" + (t ? ": " + esc(t) : "");
        }
        var s = stratDef(id);
        return s ? s.emoji + " " + esc(s.label) : esc(id);
      });
      return (
        '<article class="detalle-dia"><h3>' + d.emoji + " " + esc(d.label) + "</h3>" +
        "<p><strong>¿Pude calmarme?</strong> " + calma + "</p>" +
        "<p><strong>Estrategias:</strong> " + (ests.length ? "" : "Sin registrar") + "</p>" +
        (ests.length ? '<ul class="chips"><li>' + ests.join("</li><li>") + "</li></ul>" : "") +
        "<p><strong>Hoy me sentí orgulloso/a porque:</strong> " + (esc((data.orgullo || "").trim()) || "—") + "</p>" +
        "<p><strong>Mañana voy a intentar:</strong> " + (esc((data.manana || "").trim()) || "—") + "</p></article>"
      );
    }).join("");

    box.innerHTML = tabla + detalles +
      '<div class="detalle-dia firma"><p><strong>❤️ Recuerdo:</strong> Enojarse está bien. Lastimar, insultar o pegar no. Puedo aprender a calmarme. 🌈</p>' +
      "<p>Firma: ________________________________</p></div>";
  }

  /* ---------- Vistas ---------- */
  function mostrarVista(v) {
    ui.vista = v;
    ["hoy", "semana", "resumen"].forEach(function (x) {
      $("view-" + x).hidden = x !== v;
      var tab = $("tab-" + x);
      tab.classList.toggle("is-active", x === v);
      if (x === v) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
    if (v === "semana") renderSemana();
    if (v === "resumen") renderResumen();
    var h = document.querySelector("#view-" + v + " h2");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
  }

  /* ---------- Eventos ---------- */
  var yaIniciado = false;
  function init() {
    if (yaIniciado) return; // evita doble registro de eventos (doble avance)
    yaIniciado = true;
    cargar();
    if (!state.dias[ui.dia]) ui.dia = "lunes";

    $("input-nombre").value = state.nombre || "";
    $("input-semana").value = state.semana || "";

    renderDias();
    renderPaso(false);
    actualizarProgreso();

    $("input-nombre").addEventListener("input", function (e) {
      state.nombre = e.target.value;
      guardarDebounced();
    });
    $("input-semana").addEventListener("input", function (e) {
      state.semana = e.target.value;
      guardarDebounced();
    });

    document.querySelectorAll(".tab").forEach(function (b) {
      b.addEventListener("click", function () { mostrarVista(b.dataset.vista); });
    });

    // Cambio de día
    $("dias").addEventListener("change", function (e) {
      var v = e.target && e.target.value;
      if (!v || !state.dias[v]) return;
      ui.dia = v;
      ui.paso = 0;
      renderDias();
      renderPaso(true);
      anunciar("Día cambiado a " + diaLabel(v) + ".");
    });

    // Interacción dentro del paso (delegación)
    $("paso-contenido").addEventListener("change", function (e) {
      var t = e.target;
      if (!t || !t.name) return;
      var diaId = ui.dia;
      var data = state.dias[diaId];

      if (t.name.indexOf("face-") === 0) {
        var aspId = t.name.slice(5);
        data.aspectos[aspId] = t.value;
        guardar();
        // marcar visual sin re-render (conserva el foco)
        document.querySelectorAll("#paso-contenido .carita").forEach(function (l) {
          var inp = l.querySelector("input");
          l.classList.toggle("seleccionada", inp && inp.checked);
        });
        renderDias();
        actualizarProgreso();
        var f = faceDef(t.value);
        anunciar(esc((f ? f.name : t.value)) + " elegido en " + aspectoDef(aspId).name + ". ✓");
      } else if (t.name === "calma") {
        data.calma = t.value;
        guardar();
        document.querySelectorAll('#paso-contenido input[name="calma"]').forEach(function (inp) {
          inp.closest("label").classList.toggle("seleccionada", inp.checked);
        });
        renderDias();
        actualizarProgreso();
        anunciar("Respuesta guardada. ✓");
      } else if (t.name === "est") {
        var set = new Set(data.estrategias);
        if (t.checked) set.add(t.value);
        else set.delete(t.value);
        data.estrategias = Array.from(set);
        guardar();
        var lab = t.closest("label");
        if (lab) lab.classList.toggle("seleccionada", t.checked);
        var otraTxt = $("otra-texto");
        if (otraTxt) otraTxt.disabled = data.estrategias.indexOf("otra") === -1;
        anunciar(t.checked ? "Estrategia agregada. ✓" : "Estrategia quitada.");
      }
    });

    $("paso-contenido").addEventListener("input", function (e) {
      var t = e.target;
      var data = state.dias[ui.dia];
      if (t.id === "input-orgullo") { data.orgullo = t.value; guardarDebounced(); actualizarProgreso(); }
      else if (t.id === "input-manana") { data.manana = t.value; guardarDebounced(); actualizarProgreso(); }
      else if (t.id === "otra-texto") { data.otraEstrategia = t.value; guardarDebounced(); }
    });

    $("btn-atras").addEventListener("click", function () { irPaso(ui.paso - 1, true); });
    $("btn-siguiente").addEventListener("click", function () {
      if (ui.paso === TOTAL_PASOS - 1) {
        renderDias();
        mostrarVista("resumen");
        anunciar("¡Bien! Terminaste el " + diaLabel(ui.dia) + ". 🎉");
      } else {
        irPaso(ui.paso + 1, true);
      }
    });

    // Semana: saltar a un día
    $("semana-grid").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-dia]");
      if (!b) return;
      ui.dia = b.dataset.dia;
      ui.paso = 0;
      renderDias();
      renderPaso(false);
      mostrarVista("hoy");
      irPaso(0, true);
    });

    $("btn-imprimir").addEventListener("click", function () { window.print(); });

    var dlg = $("dialogo-nueva");
    $("btn-nueva").addEventListener("click", function () {
      if (typeof dlg.showModal === "function") {
        dlg.showModal();
        $("btn-cancelar").focus();
      } else if (confirm("¿Empezar una nueva semana? Se borrarán los datos actuales.")) {
        nuevaSemana();
      }
    });
    $("btn-cancelar").addEventListener("click", function () { dlg.close(); });
    $("btn-confirmar-nueva").addEventListener("click", function () {
      dlg.close();
      nuevaSemana();
    });
  }

  function nuevaSemana() {
    var nombre = state.nombre;
    state = estadoInicial();
    state.nombre = nombre;
    state.semana = "";
    $("input-semana").value = "";
    ui.paso = 0;
    guardar();
    renderDias();
    renderPaso(false);
    actualizarProgreso();
    mostrarVista("hoy");
    anunciar("Nueva semana empezada. ¡Cada día puedes aprender y mejorar! 🌈");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Funcionar sin internet en el celular (solo cuando hay http/https).
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
