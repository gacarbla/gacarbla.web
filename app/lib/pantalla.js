export function enPantalla(el) {
    return document.fullscreenElement === el;
}
export function alternarPantalla(el) {
    if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {
        });
        return;
    }
    const pedir = el.requestFullscreen?.bind(el);
    if (pedir) {
        void pedir().catch(() => {
        });
    }
}
export function vigilarPantalla(el, alCambiar) {
    const fn = () => alCambiar(document.fullscreenElement === el);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
}
