// Catálogo usado no SERVIDOR para calcular o valor cobrado na InfinitePay.
// O preço nunca vem do navegador: o site só manda o que foi escolhido e a conta é feita aqui.
// Ao mudar preços no site (index.html: FORMS, KITS, PRODS), mude aqui também.

// InfiniteTag da Hype Drink (nome de usuário no app InfinitePay, sem o "$").
// Pode ficar aqui ou na variável de ambiente INFINITEPAY_HANDLE do Netlify.
const TAG = ""; // ex.: "hypefitdrink"
export const HANDLE = (process.env.INFINITEPAY_HANDLE || TAG).replace(/^\$/, "").trim();

export const FORMS = {cup: {nome: "Copo 1L", centavos: 3000}, bottle: {nome: "Garrafa 1L", centavos: 3000}};
export const KITS = {k6: {n: 6, centavos: 16000}, k7: {n: 7, centavos: 18000}, k8: {n: 8, centavos: 20000}};
export const PRODS = {
  cr7:     {nome: "CR7 Drive",          centavos: 24990, var: null},
  liftoff: {nome: "LiftOff",            centavos: 14990, var: ["Limão", "Abacaxi", "Amora"]},
  herbal:  {nome: "Herbal Concentrate", centavos: 13990, var: null},
  nrg:     {nome: "N.R.G.",             centavos: 11990, var: null}
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
    const p = PRODS[it.pid]; if (!p) return null;
    let desc = p.nome;
    if (p.var){ if (!p.var.includes(it.v)) return null; desc += ` ${it.v}`; }
    return {description: `${desc} (Herbalife)`, price: p.centavos, quantity: qty};
  }

  if (!BASES.includes(it.base)) return null;
  const extras = Array.isArray(it.extras) ? [...new Set(it.extras)] : [];
  if (extras.length > 9 || extras.some(x => !SABORES[x] || x === it.base)) return null;

  if (it.form === "kit"){
    const k = KITS[it.kit]; if (!k) return null;
    const desc = `Kit ${k.n} sachês + garrafa, copo e canudos` + (it.pronto ? ` + drink pronto ${sabor(it.base, extras)}` : "");
    return {description: desc.slice(0, 120), price: k.centavos, quantity: qty};
  }

  const f = FORMS[delivery ? "bottle" : it.form]; if (!f || !FORMS[it.form]) return null;
  return {description: `${f.nome} ${sabor(it.base, extras)}`.slice(0, 120), price: f.centavos, quantity: qty};
}

export const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: {"content-type": "application/json; charset=utf-8", "cache-control": "no-store"}
});
