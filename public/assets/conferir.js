// Página da equipe: confere se um pedido pago bate com o valor recebido na InfinitePay.
const $ = s => document.querySelector(s);
const q = new URLSearchParams(location.search);
const fmt = c => (c / 100).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
const ICON = {
  ok:'<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>',
  bad:'<svg viewBox="0 0 24 24"><path d="M12 7v6M12 17h.01"/></svg>',
  warn:'<svg viewBox="0 0 24 24"><path d="M12 7v6M12 17h.01"/></svg>'
};
function state(kind, eb, tt, tx){
  $("#box").className = "paybox " + kind; $("#ic").innerHTML = ICON[kind];
  $("#eb").textContent = eb; $("#tt").textContent = tt; $("#tx").textContent = tx;
}
// linhas "rótulo / valor" montadas como texto (nada de HTML vindo de fora)
function linhas(el, pares){
  el.replaceChildren(...pares.flatMap(([k, v]) => {
    const a = document.createElement("span"), b = document.createElement("b");
    a.textContent = k; b.textContent = v; return [a, b];
  }));
  el.hidden = false;
}

async function run(){
  const b = {o:q.get("o") || "", t:q.get("t") || "", s:q.get("s") || "", d:q.get("d") || "0", i:q.get("i") || ""};
  if (!b.o || !b.t || !b.s || !b.i)
    return state("bad", "Atenção", "Link incompleto", "Abra o link inteiro que veio na mensagem do pedido, ou confira direto no app da InfinitePay.");
  let r = null, d = {};
  try {
    r = await fetch("/api/conferir", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(b)});
    d = await r.json();
  } catch (e) {}
  if (!r || r.status >= 500 || r.status === 429)
    return state("warn", "Conferência", "Não deu para conferir agora", "Atualize a página em alguns segundos. Se continuar, confira o pedido no app da InfinitePay.");
  if (!r.ok || !Array.isArray(d.itens))
    return state("bad", "Atenção", "Link alterado ou inválido", "Os dados deste link não batem com um pedido do site. Não prepare o pedido antes de conferir no app da InfinitePay.");

  linhas($("#sum"), [
    ["Pedido", d.pedido], ["Recebimento", d.recebimento], ["Valor dos itens", fmt(d.valorItens)],
    ["Valor pago", typeof d.valorPago === "number" ? fmt(d.valorPago) : "-"], ["Forma", d.metodo || "-"]
  ]);
  $("#itens").replaceChildren(...d.itens.map(it => {
    const li = document.createElement("li"), n = document.createElement("span"), v = document.createElement("b");
    n.textContent = `${it.qtd}× ${it.nome}`; v.textContent = fmt(it.valor); li.append(n, v); return li;
  }));
  $("#itens").hidden = false;

  if (d.confere) state("ok", "Pode preparar", "Pago e o valor confere", "A InfinitePay confirmou o pagamento e o valor bate com os itens abaixo. Prepare exatamente estes itens.");
  else if (d.pago) state("bad", "Atenção", "Pago, mas o valor não bate", "O valor recebido é diferente do valor destes itens. A mensagem pode ter sido alterada: confira com o cliente antes de preparar.");
  else state("bad", "Atenção", "Pagamento não confirmado", "A InfinitePay ainda não mostra este pedido como pago. Não prepare até confirmar no app da InfinitePay.");
}
run();
