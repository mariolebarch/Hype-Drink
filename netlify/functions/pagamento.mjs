// POST /api/pagamento  → confirma na InfinitePay se o pedido foi pago (usado na página obrigado.html).
import {HANDLE, campoOk, consultar, json, lerJson, excedeu, muitas} from "../lib/catalogo.mjs";

export const config = {
  path: "/api/pagamento",
  rateLimit: {windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"]}
};

export default async (req) => {
  if (excedeu(req, "pagamento", 30)) return muitas();
  const {body: b, erro} = await lerJson(req); if (erro) return erro;
  if (!HANDLE) return json(503, {erro: "Pagamento online ainda não configurado"});
  if (!campoOk(b.order_nsu) || !campoOk(b.transaction_nsu) || !campoOk(b.slug)) return json(400, {erro: "Dados do pagamento incompletos"});

  try {
    return json(200, await consultar(b));
  } catch (e) {
    console.error("InfinitePay /payment_check falhou", e);
    return json(502, {erro: "Não foi possível confirmar agora"});
  }
};
