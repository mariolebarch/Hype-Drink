// POST /api/checkout  → cria o link de pagamento da InfinitePay (Pix ou cartão) para a sacola.
import {HANDLE, itemParaCobranca, json} from "../lib/catalogo.mjs";

export const config = {path: "/api/checkout"};

export default async (req) => {
  if (req.method !== "POST") return json(405, {erro: "Método não permitido"});
  if (!HANDLE) return json(503, {erro: "Pagamento online ainda não configurado"});

  let body;
  try { body = await req.json(); } catch { return json(400, {erro: "Pedido inválido"}); }

  const lista = Array.isArray(body.items) ? body.items : [];
  if (!lista.length || lista.length > 40) return json(400, {erro: "Sacola vazia ou grande demais"});

  const items = [];
  for (const it of lista){
    const c = itemParaCobranca(it, !!body.delivery);
    if (!c) return json(400, {erro: "Item inválido na sacola"});
    items.push(c);
  }
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  if (total < 100) return json(400, {erro: "Valor mínimo de R$ 1,00"});

  const nsu = "HD-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const origin = new URL(req.url).origin;

  const payload = {
    handle: HANDLE,
    items,
    order_nsu: nsu,
    redirect_url: `${origin}/obrigado.html`
  };
  const nome = typeof body.nome === "string" ? body.nome.trim().slice(0, 80) : "";
  if (nome) payload.customer = {name: nome};

  try {
    const r = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: {"content-type": "application/json", accept: "application/json"},
      body: JSON.stringify(payload)
    });
    const txt = await r.text();
    let data = {}; try { data = JSON.parse(txt); } catch {}
    const url = data.url || data.payment_url || data.link || data.checkout_url;
    if (!r.ok || !url){
      console.error("InfinitePay /links", r.status, txt.slice(0, 500));
      return json(502, {erro: "Não foi possível gerar o pagamento agora"});
    }
    return json(200, {url, nsu, total});
  } catch (e) {
    console.error("InfinitePay /links falhou", e);
    return json(502, {erro: "Não foi possível falar com a InfinitePay"});
  }
};
