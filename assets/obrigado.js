const WHATSAPP = "5531989691851";
const $ = s => document.querySelector(s);
const q = new URLSearchParams(location.search);
const P = {order_nsu:q.get("order_nsu") || "", transaction_nsu:q.get("transaction_nsu") || "", slug:q.get("slug") || q.get("invoice_slug") || ""};
const receipt = q.get("receipt_url") || "";
let pend = null;
try { pend = JSON.parse(localStorage.getItem("hype_pending_v1") || "null"); } catch (e) {}
const fmt = c => (c / 100).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
const safeUrl = u => { try { const x = new URL(u); return x.protocol === "https:" ? x.href : ""; } catch (e) { return ""; } };

function state(kind, eb, tt, tx){
  $("#box").className = "paybox " + kind;
  $("#ic").innerHTML = kind === "ok" ? '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>'
    : kind === "bad" ? '<svg viewBox="0 0 24 24"><path d="M12 7v6M12 17h.01"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9"/></svg>';
  $("#eb").textContent = eb; $("#tt").textContent = tt; $("#tx").textContent = tx;
}
function waLink(text){ return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`; }
// link que a equipe abre para conferir se o valor pago bate com os itens do pedido (conferir.html)
function confLink(){
  if (!pend || pend.nsu !== P.order_nsu || !Array.isArray(pend.items)) return "";
  try {
    const it = pend.items.map(x => ({f:x.form, b:x.base, e:x.extras, k:x.kit, p:x.pronto ? 1 : 0, i:x.pid, v:x.v, q:x.qty}));
    const bin = String.fromCharCode(...new TextEncoder().encode(JSON.stringify(it)));
    const i = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const q = new URLSearchParams({o:P.order_nsu, t:P.transaction_nsu, s:P.slug, d:pend.delivery ? "1" : "0", i});
    return `${location.origin}/conferir.html?${q}`;
  } catch (e) { return ""; }
}

async function run(){
  if (!P.order_nsu || !P.transaction_nsu || !P.slug){
    state("bad", "Pagamento", "Não encontramos os dados do pagamento", "Se você pagou, fale com a Hype no WhatsApp com o comprovante que a InfinitePay enviou.");
    $("#wa").textContent = "Falar no WhatsApp"; $("#wa").href = waLink("Olá! Fiz um pagamento pelo site da Hype e preciso de ajuda."); $("#wa").hidden = false; $("#bk").hidden = false;
    return;
  }
  let d = {};
  try {
    const r = await fetch("/api/pagamento", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(P)});
    d = await r.json();
  } catch (e) {}
  const rec = safeUrl(receipt);
  if (rec){ $("#rc").href = rec; $("#rc").hidden = false; }

  if (d.pago){
    state("ok", "Pagamento confirmado", "Pagamento aprovado!", "Agora é só enviar o pedido no WhatsApp pra Hype começar a preparar.");
    const total = typeof d.valor === "number" ? fmt(d.valor) : pend && pend.total ? fmt(pend.total) : "";
    $("#sum").innerHTML = `<span>Pedido</span><b></b><span>Valor</span><b>${total || "-"}</b><span>Forma</span><b>${d.metodo || "-"}</b>`;
    $("#sum b").textContent = P.order_nsu; $("#sum").hidden = false;
    const base = pend && pend.nsu === P.order_nsu ? pend.msg : "*⚡ NOVO PEDIDO · HYPE DRINK*";
    const conf = confLink();
    const msg = base.replace("_Pedido enviado pelo site_", "").trimEnd() + "\n\n" +
      `✅ *PAGO ONLINE* (${d.metodo || "InfinitePay"})${total ? ` · ${total}` : ""}\nPedido: ${P.order_nsu}` + (rec ? `\nComprovante: ${rec}` : "") +
      (conf ? `\n🔎 Conferir pagamento: ${conf}` : "") + "\n\n_Pedido enviado pelo site_";
    $("#wa").href = waLink(msg); $("#wa").hidden = false;
    $("#sm").textContent = "Importante: toque em \"Enviar pedido no WhatsApp\" e envie a mensagem. É assim que a Hype recebe o seu endereço e os sabores."; $("#sm").hidden = false;
    try { if (pend && pend.nsu === P.order_nsu){ localStorage.removeItem("hype_bag_v1"); } } catch (e) {}
    $("#wa").addEventListener("click", () => { try { localStorage.removeItem("hype_pending_v1"); } catch (e) {} });
  } else {
    state("bad", "Pagamento", d.erro ? "Não conseguimos confirmar agora" : "Pagamento não confirmado",
      d.erro ? "Tente atualizar a página em alguns segundos. Se o valor saiu da sua conta, fale com a Hype no WhatsApp." : "O pagamento ainda não aparece como aprovado. Se você pagou com cartão ou Pix, aguarde um pouco e atualize a página.");
    $("#wa").textContent = "Falar no WhatsApp";
    $("#wa").href = waLink(`Olá! Fiz um pagamento pelo site da Hype (pedido ${P.order_nsu}) e ele não apareceu como confirmado.` + (rec ? ` Comprovante: ${rec}` : ""));
    $("#wa").hidden = false; $("#bk").hidden = false;
  }
}
run();
