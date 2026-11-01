import { initBotId } from "botid/client/core";

// Captcha invisible: las personas no ven nada; solo se protege el envío del pedido
// (la acción del servidor se publica en /carrito).
initBotId({ protect: [{ path: "/carrito", method: "POST" }] });
