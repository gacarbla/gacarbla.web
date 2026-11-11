/**
 * Datos del sistema. Cada planeta es una rama de trabajo; sus proyectos
 * son los satélites que lo orbitan.
 */
export const PLANETAS = [
  {
    id: "personal",
    nombre: "Personal",
    color: "#3f7bd9",
    proyectos: [
      {
        id: "portfolio",
        nombre: "Portfolio",
        dominio: "portfolio.gacarbla.es",
        url: "https://portfolio.gacarbla.es/",
        estado: "En línea",
        color: "#ffb86b",
      },
    ],
  },
  {
    id: "api",
    nombre: "API",
    color: "#2fb58a",
    proyectos: [
      {
        id: "api",
        nombre: "API",
        dominio: "api.gacarbla.es",
        url: null,
        estado: "En preparación",
        color: "#7ef0c4",
      },
    ],
  },
  {
    id: "games",
    nombre: "Games",
    color: "#b06cff",
    proyectos: [
      {
        id: "games",
        nombre: "Games",
        dominio: "games.gacarbla.es",
        url: "https://games.gacarbla.es/",
        estado: "En línea",
        color: "#ff8a64",
      },
    ],
  },
];
