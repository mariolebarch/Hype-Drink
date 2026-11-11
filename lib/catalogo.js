// Catálogo usado no SERVIDOR para calcular o valor cobrado na InfinitePay.
// O preço nunca vem do navegador: o site só manda o que foi escolhido e a conta é feita aqui.
// Ao mudar preços no site (public/assets/site.js: FORMS, KITS, PRODS), mude aqui também.

// InfiniteTag da Hype Drink (nome de usuário no app InfinitePay, sem o "$").
const TAG = "jakeline-rodrigues-81y"; // InfiniteTag da conta da cliente (Conta Lojista CPF)
// Produtos Herbalife no pagamento online (preços reais passados pela cliente em 10/11/2026)
export const PRODS_ONLINE = true;
export const HANDLE = TAG.replace(/^\$/, "").trim();

export const FORMS = {cup: {nome: "Copo 1L", centavos: 3000}, bottle: {nome: "Garrafa 1L", centavos: 3000}};
export const KITS = {k6: {n: 6, centavos: 16000}, k7: {n: 7, centavos: 18000}, k8: {n: 8, centavos: 20000}};
// var: sabores (mesmo preço) ou tamanhos com preço próprio {tamanho: centavos}
export const PRODS = {
  cr7:     {nome: "CR7 Drive",          centavos: 24300, var: null},
  liftoff: {nome: "LiftOff",            centavos: 19600, var: ["Limão", "Abacaxi", "Amora"]},
  herbal:  {nome: "Herbal Concentrate", centavos: null,  var: {"50 g": 22200, "102 g": 26400, "357 g": 107200}},
  nrg:     {nome: "N.R.G.",             centavos: null,  var: {"60 g": 15900, "100 g": 25200, "330 g": 66800}}
};
export const SABORES = {
  limao: "Limão", amora: "Amora", abacaxi: "Abacaxi", morango: "Morango", uva: "Uva", maracuja: "Maracujá",
  jabuticaba: "Jabuticaba", tangerina: "Tangerina", pink: "Pink Lemonade"
};
export const BASES = ["limao", "amora", "abacaxi"];

const sabor = (base, extras) => [base, ...extras].map(id => SABORES[id]).join(" + ");

// Converte um item da sacola em {description, price, quantity} validado. Retorna null se for inválido.
export function itemParaCobranca(it, delivery){
  if (!it || typeof it !== "object") return null;
  const qty = Number.isInteger(it.qty) ? it.qty : parseInt(it.qty, 10);
  if (!(qty >= 1 && qty <= 30)) return null;

  if (it.form === "prod"){
    if (!PRODS_ONLINE) return null;
    const p = PRODS[it.pid]; if (!p) return null;
    let desc = p.nome, price = p.centavos;
    if (Array.isArray(p.var)){ if (!p.var.includes(it.v)) return null; desc += ` ${it.v}`; }
    else if (p.var){ if (typeof it.v !== "string" || !Object.hasOwn(p.var, it.v)) return null; desc += ` ${it.v}`; price = p.var[it.v]; }
    if (!Number.isInteger(price)) return null;
    return {description: `${desc} (Herbalife)`, price, quantity: qty};
  }

  if (!BASES.includes(it.base)) return null;
  const extras = Array.isArray(it.extras) ? [...new Set(it.extras)] : [];
  if (extras.length > 1 || extras.some(x => !SABORES[x] || x === it.base)) return null;

  if (it.form === "kit"){
    const k = KITS[it.kit]; if (!k) return null;
    const desc = `Kit ${k.n} sachês + garrafa, copo e canudos` + (it.pronto ? ` + drink pronto ${sabor(it.base, extras)}` : "");
    return {description: desc.slice(0, 120), price: k.centavos, quantity: qty};
  }

  const f = FORMS[delivery ? "bottle" : it.form]; if (!f || !FORMS[it.form]) return null;
  return {description: `${f.nome} ${sabor(it.base, extras)}`.slice(0, 120), price: f.centavos, quantity: qty};
}

export const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: {"content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff"}
});

// Soma o valor (centavos) de uma lista de itens da sacola. Retorna null se algum item for inválido.
export function cobrar(lista, delivery){
  if (!Array.isArray(lista) || !lista.length || lista.length > 40) return null;
  const items = [];
  for (const it of lista){ const c = itemParaCobranca(it, !!delivery); if (!c) return null; items.push(c); }
  return {items, total: items.reduce((s, i) => s + i.price * i.quantity, 0)};
}

// Campos que voltam da InfinitePay (número do pedido, transação, slug)
export const campoOk = (v, max = 120) => typeof v === "string" && v.length > 0 && v.length <= max && /^[\w.\-]+$/.test(v);

// Só aceita POST com corpo JSON (barra envio "às cegas" a partir de outros sites)
export async function lerJson(req){
  if (req.method !== "POST") return {erro: json(405, {erro: "Método não permitido"})};
  if (!/^application\/json\b/i.test(req.headers.get("content-type") || "")) return {erro: json(415, {erro: "Envie os dados em JSON"})};
  const txt = await req.text();
  if (txt.length > 20000) return {erro: json(413, {erro: "Pedido grande demais"})};
  try { const body = JSON.parse(txt); if (body && typeof body === "object") return {body}; } catch {}
  return {erro: json(400, {erro: "Pedido inválido"})};
}

// Limite de chamadas por IP, contado dentro de cada instância da função no Cloudflare.
// (Com domínio próprio no Cloudflare dá para somar uma regra de Rate Limiting no painel.)
const hits = new Map();
export function excedeu(req, nome, limite, janelaMs = 60000){
  const ip = req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  const k = `${nome}|${ip}`, agora = Date.now();
  const lista = (hits.get(k) || []).filter(t => agora - t < janelaMs);
  lista.push(agora); hits.set(k, lista);
  if (hits.size > 5000) hits.clear();
  return lista.length > limite;
}
export const muitas = () => json(429, {erro: "Muitas tentativas seguidas. Aguarde um minuto."});

// Consulta a InfinitePay. Também usada pela conferência da equipe (functions/api/conferir.js).
export async function consultar(b){
  const r = await fetch("https://api.checkout.infinitepay.io/payment_check", {
    method: "POST",
    headers: {"content-type": "application/json", accept: "application/json"},
    body: JSON.stringify({handle: HANDLE, order_nsu: b.order_nsu, transaction_nsu: b.transaction_nsu, slug: b.slug})
  });
  const d = await r.json().catch(() => ({}));
  return {
    pago: d.success === true && d.paid === true,
    valor: typeof d.amount === "number" ? d.amount : null,
    metodo: d.capture_method === "pix" ? "Pix" : d.capture_method === "credit_card" ? "Cartão de crédito" : null
  };
}
