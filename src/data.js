/**
 * Datos del sistema. Cada planeta es una rama de trabajo con su propia
 * órbita, tamaño y velocidades; sus proyectos son los satélites.
 *
 * Orden de dentro a fuera: Core, Personal, Herramientas y Pasatiempos.
 */
export const PLANETAS = [
  {
    id: "core",
    nombre: "Core",
    color: "#2fb58a",
    orbita: 3.0,
    tamano: 0.62,
    giro: 0.35,
    traslacion: 0.16,
    inclinacion: 0.05,
    proyectos: [
      {
        id: "api",
        nombre: "API",
        dominio: "api.gacarbla.es/docs",
        url: "https://api.gacarbla.es/docs",
        estado: "En línea",
        color: "#7ef0c4",
      },
    ],
  },
  {
    id: "personal",
    nombre: "Personal",
    color: "#3f7bd9",
    orbita: 4.8,
    tamano: 0.9,
    giro: 0.12,
    traslacion: 0.11,
    inclinacion: 0.16,
    proyectos: [
      {
        id: "cv",
        nombre: "CV",
        dominio: "cv.gacarbla.es",
        url: "https://cv.gacarbla.es/",
        estado: "En línea",
        color: "#9cc7ff",
      },
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
    id: "herramientas",
    nombre: "Herramientas",
    color: "#9b6bff",
    orbita: 6.6,
    tamano: 0.78,
    giro: 0.2,
    traslacion: 0.08,
    inclinacion: 0.1,
    proyectos: [
      {
        id: "myweb",
        nombre: "MyWeb",
        dominio: "myweb.gacarbla.es",
        url: null,
        estado: "Próximamente",
        color: "#f0a6ff",
      },
    ],
  },
  {
    id: "pasatiempos",
    nombre: "Pasatiempos",
    color: "#ff7a59",
    orbita: 8.4,
    tamano: 1.0,
    giro: 0.08,
    traslacion: 0.06,
    inclinacion: 0.2,
    proyectos: [
      {
        id: "games",
        nombre: "Games",
        dominio: "games.gacarbla.es",
        url: "https://games.gacarbla.es/",
        estado: "En línea",
        color: "#ffd166",
      },
      {
        id: "play",
        nombre: "Play",
        dominio: "play.gacarbla.es",
        url: null,
        estado: "Próximamente",
        color: "#ff6b8a",
      },
    ],
  },
];
