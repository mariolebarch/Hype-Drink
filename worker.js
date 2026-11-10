// Cloudflare Worker: responde às rotas /api/* do pagamento online.
// O resto (páginas, fotos, scripts) é servido direto da pasta public/ pelo Cloudflare, sem passar por aqui.
import * as checkout from "./functions/api/checkout.js";
import * as pagamento from "./functions/api/pagamento.js";
import * as conferir from "./functions/api/conferir.js";
import {json} from "./lib/catalogo.js";

const ROTAS = {"/api/checkout": checkout, "/api/pagamento": pagamento, "/api/conferir": conferir};

export default {
  async fetch(request, env){
    const rota = ROTAS[new URL(request.url).pathname];
    if (rota) return rota.onRequest({request, env});
    if (new URL(request.url).pathname.startsWith("/api/")) return json(404, {erro: "Rota não encontrada"});
    return env.ASSETS.fetch(request);
  }
};
