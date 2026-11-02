import { component, routeEvent } from "../../lib/rtw/index.js";
export const Btn = component("x-btn", import.meta.url, {
    attrs: ["href", "variant"],
    setup({ shadow, host, attr, onCleanup }) {
        const variant = attr("variant") ?? "";
        const href = attr("href");
        const anchor = shadow.querySelector("a");
        if (!anchor)
            return;
        anchor.className = variant ? `btn ${variant}` : "btn";
        if (href) {
            anchor.setAttribute("href", href);
        }
        else {
            anchor.removeAttribute("href");
            anchor.setAttribute("role", "button");
            anchor.setAttribute("tabindex", "0");
            const onKey = (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    anchor.click();
                }
            };
            anchor.addEventListener("keydown", onKey);
            onCleanup(() => anchor.removeEventListener("keydown", onKey));
        }
        const onClick = (e) => {
            const go = host.getAttribute("data-go");
            if (!go)
                return;
            e.preventDefault();
            host.dispatchEvent(routeEvent(go));
        };
        anchor.addEventListener("click", onClick);
        onCleanup(() => anchor.removeEventListener("click", onClick));
    },
});
