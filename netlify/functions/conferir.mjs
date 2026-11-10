// POST /api/conferir  → a equipe confere um pedido pago que chegou no WhatsApp (página conferir.html).
// versão do catálogo: 2026-11-10 (mudar esta linha quando alterar netlify/lib/catalogo.mjs, para o Netlify reempacotar a função)
// O link traz os itens do pedido. O servidor recalcula o valor desses itens com os preços do catálogo e
// compara com o valor que a InfinitePay diz ter recebido. Se o cliente mexer nos itens, o valor não bate.
import {HANDLE, campoOk, cobrar, consultar, json, lerJson, excedeu, muitas} from "../lib/catalogo.mjs";

export const config = {
  path: "/api/conferir",
  rateLimit: {windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"]}
};

// itens compactados no link: {f:form, b:base, e:extras, k:kit, p:pronto, i:pid, v:variação, q:qtd}
function lerItens(txt){
  if (typeof txt !== "string" || !txt.length || txt.length > 4000 || !/^[\w-]+$/.test(txt)) return null;
  try {
    const arr = JSON.parse(Buffer.from(txt, "base64url").toString("utf8"));
    if (!Array.isArray(arr)) return null;
    return arr.map(x => x && typeof x === "object" ? {form: x.f, base: x.b, extras: x.e, kit: x.k, pronto: x.p === 1, pid: x.i, v: x.v, qty: x.q} : null);
  } catch { return null; }
}

export default async (req) => {
  if (excedeu(req, "conferir", 30)) return muitas();
  const {body: b, erro} = await lerJson(req); if (erro) return erro;
  if (!HANDLE) return json(503, {erro: "Pagamento online ainda não configurado"});
  if (!campoOk(b.o, 40) || !/^HD-[A-Z0-9]+$/.test(b.o) || !campoOk(b.t) || !campoOk(b.s)) return json(400, {erro: "Link incompleto ou alterado"});
  const delivery = b.d === "1";
  const conta = cobrar(lerItens(b.i), delivery);
  if (!conta) return json(400, {erro: "Link incompleto ou alterado"});

  try {
    const pg = await consultar({order_nsu: b.o, transaction_nsu: b.t, slug: b.s});
    return json(200, {
      pedido: b.o,
      pago: pg.pago,
      valorPago: pg.valor,
      valorItens: conta.total,
      confere: pg.pago && pg.valor === conta.total,
      metodo: pg.metodo,
      recebimento: delivery ? "Delivery" : "Retirada",
      itens: conta.items.map(i => ({nome: i.description, qtd: i.quantity, valor: i.price * i.quantity}))
    });
  } catch (e) {
    console.error("conferir: InfinitePay falhou", e);
    return json(502, {erro: "Não foi possível falar com a InfinitePay agora"});
  }
};
