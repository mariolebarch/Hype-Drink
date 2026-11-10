// POST /api/checkout  → cria o link de pagamento da InfinitePay (Pix ou cartão) para a sacola.
// versão do catálogo: 2026-11-10 (mudar esta linha quando alterar netlify/lib/catalogo.mjs, para o Netlify reempacotar a função)
import {HANDLE, cobrar, json, lerJson, excedeu, muitas} from "../lib/catalogo.mjs";

export const config = {
  path: "/api/checkout",
  rateLimit: {windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"]}
};

export default async (req) => {
  if (excedeu(req, "checkout", 10)) return muitas();
  const {body, erro} = await lerJson(req); if (erro) return erro;
  if (!HANDLE) return json(503, {erro: "Pagamento online ainda não configurado"});

  const lista = Array.isArray(body.items) ? body.items : [];
  if (!lista.length || lista.length > 40) return json(400, {erro: "Sacola vazia ou grande demais"});
  const conta = cobrar(lista, body.delivery);
  if (!conta) return json(400, {erro: "Item inválido na sacola"});
  const {items, total} = conta;
  if (total < 100) return json(400, {erro: "Valor mínimo de R$ 1,00"});

  const nsu = "HD-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const origin = new URL(req.url).origin;

  const payload = {
    handle: HANDLE,
    items,
    order_nsu: nsu,
    redirect_url: `${origin}/obrigado.html`
  };
  const nome = typeof body.nome === "string" ? body.nome.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80) : "";
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
    if (!r.ok || !url || !/^https:\/\//.test(url)){
      console.error("InfinitePay /links", r.status, txt.slice(0, 500));
      return json(502, {erro: "Não foi possível gerar o pagamento agora"});
    }
    return json(200, {url, nsu, total});
  } catch (e) {
    console.error("InfinitePay /links falhou", e);
    return json(502, {erro: "Não foi possível falar com a InfinitePay"});
  }
};
