import { component, routeEvent } from "../../lib/rtw/index.js";
export const NoEncontrado = component("x-no-encontrado", import.meta.url, {
    setup({ shadow, onCleanup }) {
        const volver = shadow.querySelector('[data-ref="volver"]');
        const onClick = (e) => {
            e.preventDefault();
            volver?.dispatchEvent(routeEvent("inicio"));
        };
        volver?.addEventListener("click", onClick);
        onCleanup(() => volver?.removeEventListener("click", onClick));
    },
});
