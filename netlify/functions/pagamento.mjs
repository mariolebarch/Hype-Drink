// POST /api/pagamento  → confirma na InfinitePay se o pedido foi pago (usado na página obrigado.html).
import {HANDLE, json} from "../lib/catalogo.mjs";

export const config = {path: "/api/pagamento"};

const ok = (v, max = 120) => typeof v === "string" && v.length > 0 && v.length <= max && /^[\w.\-]+$/.test(v);

export default async (req) => {
  if (req.method !== "POST") return json(405, {erro: "Método não permitido"});
  if (!HANDLE) return json(503, {erro: "Pagamento online ainda não configurado"});

  let b;
  try { b = await req.json(); } catch { return json(400, {erro: "Pedido inválido"}); }
  if (!ok(b.order_nsu) || !ok(b.transaction_nsu) || !ok(b.slug)) return json(400, {erro: "Dados do pagamento incompletos"});

  try {
    const r = await fetch("https://api.checkout.infinitepay.io/payment_check", {
      method: "POST",
      headers: {"content-type": "application/json", accept: "application/json"},
      body: JSON.stringify({handle: HANDLE, order_nsu: b.order_nsu, transaction_nsu: b.transaction_nsu, slug: b.slug})
    });
    const d = await r.json().catch(() => ({}));
    return json(200, {
      pago: d.success === true && d.paid === true,
      valor: typeof d.amount === "number" ? d.amount : null,
      metodo: d.capture_method === "pix" ? "Pix" : d.capture_method === "credit_card" ? "Cartão de crédito" : null
    });
  } catch (e) {
    console.error("InfinitePay /payment_check falhou", e);
    return json(502, {erro: "Não foi possível confirmar agora"});
  }
};
