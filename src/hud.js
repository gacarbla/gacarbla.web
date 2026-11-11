import { PLANETAS } from "./data.js";

/**
 * HUD: barra de etapas, panel del planeta, ficha del proyecto y foco.
 * El contenido del panel se pinta desde los datos del sistema.
 */
export function initHud({ onSystem, onPlanet, onProject }) {
  const panel = document.querySelector(".panel");
  const marco = document.querySelector(".panel-frame");
  const pasos = [...document.querySelectorAll(".rail-step")];
  const vistas = [...document.querySelectorAll("[data-panel]")];

  const kicker = document.querySelector("[data-planet-kicker]");
  const punto = document.querySelector("[data-planet-dot]");
  const nombre = document.querySelector("[data-planet-name]");
  const sub = document.querySelector("[data-planet-sub]");
  const lista = document.querySelector("[data-projects]");
  const crumb = document.querySelector("[data-crumb]");

  const proyectoNombre = document.querySelector("[data-project-name]");
  const proyectoDominio = document.querySelector("[data-project-domain]");
  const proyectoEstado = document.querySelector("[data-project-state]");
  const proyectoCta = document.querySelector("[data-project-cta]");
  const proyectoPendiente = document.querySelector("[data-project-pending]");

  let indice = 0;
  let modo = "system";

  function ajustarAltura() {
    if (!marco) return;
    const objetivo = modo === "project" ? "project" : "planet";
    const vista = vistas.find((v) => v.dataset.panel === objetivo);
    if (vista) marco.style.height = `${vista.offsetHeight}px`;
  }

  function marcarRail(i) {
    for (const paso of pasos) {
      const esSistema = paso.dataset.modeGo === "system";
      const activo = i < 0 ? esSistema : Number(paso.dataset.planetGo) === i;
      paso.classList.toggle("is-active", activo);
      if (activo) paso.setAttribute("aria-current", "step");
      else paso.removeAttribute("aria-current");
    }
  }

  function aplicarFoco() {
    document.body.dataset.mode = modo;
    for (const vista of vistas) {
      vista.toggleAttribute("inert", vista.dataset.panel !== modo);
    }
    if (panel) panel.toggleAttribute("inert", modo === "system");
    requestAnimationFrame(ajustarAltura);
  }

  function pintarPlaneta(i) {
    indice = i;
    modo = "planet";
    const datos = PLANETAS[i];

    kicker.textContent = `Planeta · ${String(i + 1).padStart(2, "0")}`;
    punto.style.background = datos.color;
    punto.style.boxShadow = `0 0 10px ${datos.color}`;
    nombre.textContent = datos.nombre;
    sub.textContent = `${String(datos.proyectos.length).padStart(2, "0")} ${
      datos.proyectos.length === 1 ? "proyecto" : "proyectos"
    } en órbita`;
    crumb.textContent = datos.nombre;

    lista.replaceChildren(
      ...datos.proyectos.map((proyecto) => {
        const item = document.createElement("li");
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "project";
        boton.dataset.project = proyecto.id;
        boton.innerHTML = `<span class="project-swatch" style="background:${proyecto.color};box-shadow:0 0 12px ${proyecto.color}"></span><span class="project-name">${proyecto.nombre}</span><span class="project-state">${proyecto.estado}</span><span class="project-arrow" aria-hidden="true">↗</span>`;
        item.append(boton);
        return item;
      }),
    );

    marcarRail(i);
    aplicarFoco();
  }

  function pintarProyecto(proyecto) {
    modo = "project";
    proyectoNombre.textContent = proyecto.nombre;
    proyectoDominio.textContent = proyecto.dominio;
    proyectoEstado.textContent = proyecto.estado;
    proyectoEstado.classList.toggle("is-live", Boolean(proyecto.url));

    if (proyecto.url) {
      proyectoCta.href = proyecto.url;
      proyectoCta.hidden = false;
      proyectoPendiente.hidden = true;
    } else {
      proyectoCta.hidden = true;
      proyectoPendiente.hidden = false;
    }

    marcarRail(indice);
    aplicarFoco();
  }

  for (const paso of pasos) {
    if (paso.dataset.modeGo === "system") {
      paso.addEventListener("click", () => onSystem());
    } else {
      paso.addEventListener("click", () => onPlanet(Number(paso.dataset.planetGo)));
    }
  }
  if (crumb) crumb.addEventListener("click", () => onPlanet(indice));
  if (lista) {
    lista.addEventListener("click", (event) => {
      const boton = event.target.closest("[data-project]");
      if (boton) onProject(boton.dataset.project);
    });
  }
  window.addEventListener("resize", ajustarAltura);

  return {
    setStop(i) {
      if (i < 0) {
        modo = "system";
        marcarRail(-1);
        aplicarFoco();
      } else {
        pintarPlaneta(i);
      }
    },
    setProject(proyecto) {
      pintarProyecto(proyecto);
    },
  };
}
