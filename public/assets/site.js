/* ===== Configuração (dados do cliente) ===== */
const WHATSAPP = "5531989691851";         // número que recebe pedidos e cadastros
const PAGAMENTO_ONLINE = true;       // true = mostra "Online" (InfinitePay) no pedido; precisa da InfiniteTag em lib/catalogo.js
const MAX_EXTRAS = 1;                 // apenas um saborizante por drink (os outros ficam bloqueados)
const FORMS = {
  cup:    {nome:"Copo 1L",       preco:30.00},
  bottle: {nome:"Garrafa 1L",    preco:30.00},
  kit:    {nome:"Kit de sachês", preco:null}    // preço vem do tamanho do kit (KITS)
};
// Kits promocionais de sachês: todos vêm com 1 garrafa, 1 copo e canudos, e podem levar 1 drink pronto
const KITS = [
  {id:"k6", n:6, preco:160.00},
  {id:"k7", n:7, preco:180.00},
  {id:"k8", n:8, preco:200.00}
];
// Produtos Herbalife vendidos avulsos (preços passados pela cliente em 10/11/2026).
// "var" = opções do produto: lista de sabores (mesmo preço) ou de tamanhos com preço próprio {v, preco}.
// Ao mudar preços aqui, mude também em lib/catalogo.js (é o valor que o servidor cobra).
const PRODS = [
  {id:"cr7",    nome:"CR7 Drive",          det:"Pote 810 g · eletrólitos, carboidratos e vitaminas", img:"assets/prod-cr7.webp",            preco:243.00},
  {id:"liftoff",nome:"LiftOff",            det:"Caixa com 15 sachês · cafeína, taurina e vitaminas",  img:"assets/prod-liftoff-limao.webp",   preco:196.00, varNome:"Sabor", var:["Limão","Abacaxi","Amora"], escolher:true,
    imgs:{"Limão":"assets/prod-liftoff-limao.webp", "Abacaxi":"assets/prod-liftoff-abacaxi.webp", "Amora":"assets/prod-liftoff-amora.webp"}},
  {id:"herbal", nome:"Herbal Concentrate", det:"Chá verde, chá preto, malva, hibisco e cardamomo",    img:"assets/prod-herbal.webp",         varNome:"Tamanho",
    var:[{v:"50 g", preco:222.00}, {v:"102 g", preco:264.00}, {v:"357 g", preco:1072.00}]},
  {id:"nrg",    nome:"N.R.G.",             det:"Chá preto e guaraná",                                img:"assets/prod-nrg.webp",            varNome:"Tamanho",
    var:[{v:"60 g", preco:159.00}, {v:"100 g", preco:252.00}, {v:"330 g", preco:668.00}]}
];
// nomes das opções e preço de um produto na opção escolhida
const varNomes = P => P.var ? P.var.map(o => typeof o === "string" ? o : o.v) : null;
const prodPreco = (P, v) => { const o = P.var && P.var.find(o => typeof o === "object" && o.v === v); return o ? o.preco : P.preco; };
const prodImg = (P, v) => (P.imgs && P.imgs[v]) || P.img; // foto da opção escolhida (ex.: sabor do LiftOff)
const LUCRO_HYPE = 7.20; // lucro por drink usado pela Hype Drink (10 hypes/dia × 30 dias = R$ 2.160)
// Bases do cardápio Hype Drink Fit
const BASES = [
  {id:"limao",   nome:"Limão",   c:"#8fdc4a"},
  {id:"amora",   nome:"Amora",   c:"#8e2a8c"},
  {id:"abacaxi", nome:"Abacaxi", c:"#ffcb3d"}
];
// Saborizantes que combinam com qualquer base (a própria base não aparece como opção). Apenas um por drink.
const EXTRAS = [
  {id:"morango",    nome:"Morango",       c:"#ff3b5c"},
  {id:"uva",        nome:"Uva",           c:"#7a3db8"},
  {id:"maracuja",   nome:"Maracujá",      c:"#ffb21a"},
  {id:"jabuticaba", nome:"Jabuticaba",    c:"#4a1a5c"},
  {id:"limao",      nome:"Limão",         c:"#8fdc4a"},
  {id:"amora",      nome:"Amora",         c:"#8e2a8c"},
  {id:"abacaxi",    nome:"Abacaxi",       c:"#ffcb3d"},
  {id:"tangerina",  nome:"Tangerina",     c:"#ff8a1f"},
  {id:"pink",       nome:"Pink Lemonade", c:"#ff7fb8"}
];

const fmt = v => v.toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
const fmt0 = v => v.toLocaleString("pt-BR", {style:"currency", currency:"BRL", maximumFractionDigits:0});
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===== Copo / garrafa em SVG ===== */
const CUP = "M40 44 L260 44 L228 404 Q227 412 219 412 L81 412 Q73 412 72 404 Z";
const BOT = "M126 44 H174 V74 C174 96 232 100 232 136 V394 Q232 414 212 414 H88 Q68 414 68 394 V136 C68 100 126 96 126 74 Z";
const WAVE = "M0 0 Q37.5 -9 75 0 T150 0 T225 0 T300 0 T375 0 T450 0 T525 0 T600 0 V520 H0 Z";
// cubos de gelo: x, y, largura, altura, giro, duração e atraso do balanço
const ICE = [
  [58,4,40,36,-12,5.2,0],[104,0,44,40,8,6.1,1.3],[154,6,40,36,-5,5.6,2.1],[200,2,38,34,14,6.6,.6],
  [76,44,36,32,10,5.9,1.8],[124,48,42,36,-9,6.4,.3],[172,42,38,34,6,5.4,2.6],[214,48,30,28,-16,6.9,1.1],
  [96,86,34,30,-14,6.2,2.3],[146,90,36,32,12,5.7,.9],[192,84,32,28,-7,6.8,1.6],[118,126,30,26,18,6.3,2.9]
].map(([x, y, w, h, r, d, dl]) => `<g class="cube" style="animation-duration:${d}s;animation-delay:-${dl}s"><g transform="rotate(${r} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/><rect class="gl" x="${x + 6}" y="${y + 5}" width="${(w * .42).toFixed(1)}" height="4" rx="2"/></g></g>`).join("");
function vessel(id){
  const bubbles = Array.from({length:9}, (_, i) =>
    `<circle cx="${70 + i * 20}" cy="${150 + (i * 37) % 160}" r="${2 + (i % 3)}" style="animation-delay:${(i * .45).toFixed(2)}s"/>`).join("");
  return `<svg class="vessel" viewBox="0 0 300 430" data-form="cup" role="img" aria-label="Copo de Hype Drink de 1 litro">
  <defs>
    <clipPath id="cc-${id}"><path d="${CUP}"/></clipPath>
    <clipPath id="cb-${id}"><path d="${BOT}"/></clipPath>
    <linearGradient id="g-${id}" gradientUnits="userSpaceOnUse" x1="0" y1="-12" x2="0" y2="340">
      <stop offset="0" class="s0" stop-color="#b6ec8a"/>
      <stop offset=".3" class="s1" stop-color="#8fdc4a"><animate attributeName="offset" values=".24;.36;.24" dur="7s" repeatCount="indefinite"/></stop>
      <stop offset=".55" class="s2" stop-color="#7fc24a"><animate attributeName="offset" values=".49;.62;.49" dur="8s" repeatCount="indefinite"/></stop>
      <stop offset=".78" class="s3" stop-color="#5a4bb8"><animate attributeName="offset" values=".72;.84;.72" dur="9s" repeatCount="indefinite"/></stop>
      <stop offset="1" class="s4" stop-color="#1e1f7e"/>
    </linearGradient>
    <path id="at-${id}" d="M -47 0 A 47 47 0 0 1 47 0"/>
    <path id="ab-${id}" d="M -52.5 0 A 52.5 52.5 0 0 0 52.5 0"/>
  </defs>
  <rect class="straw cupel" x="196" y="-34" width="11" height="230" rx="5.5" transform="rotate(16 200 80)"/>
  <path class="glass cupel" d="${CUP}"/><path class="glass botel" d="${BOT}"/>
  <g class="liq" clip-path="url(#cc-${id})">
    <g class="lvl">
      <path class="wave w2" d="${WAVE}" fill="url(#g-${id})"/>
      <path class="wave" d="${WAVE}" fill="url(#g-${id})"/>
      <g class="ice">${ICE}</g>
      <g class="bub">${bubbles}</g>
    </g>
  </g>
  <g class="stk" transform="translate(150 262)">
    <circle class="ringf" r="62"/>
    <circle r="58.5" fill="#f3f1ec"/>
    <text class="band" text-anchor="middle"><textPath href="#at-${id}" startOffset="50%">SAÚDE · NUTRIÇÃO · BEM-ESTAR</textPath></text>
    <text class="band b" text-anchor="middle"><textPath href="#ab-${id}" startOffset="50%">@HYPEFITDRINK</textPath></text>
    <circle r="43.5" fill="#0d0d10"/>
    <text class="cr7" x="0" y="-15" text-anchor="middle">CR7</text>
    <text class="mk" x="0" y="5" text-anchor="middle">HYPE</text>
    <text class="mk" x="-3.6" y="24.5" text-anchor="end">DR</text>
    <path d="M3.2 8.6 -3.4 18.4h4.2l-2.2 7.8 6.6-11.2h-4.2z" fill="#ffd23f"/>
    <text class="mk" x="5.2" y="24.5" text-anchor="start">NK</text>
    <text class="sm" x="0" y="33" text-anchor="middle">JAKE E AILTON</text>
  </g>
  <path class="edge cupel" d="${CUP}"/><path class="edge botel" d="${BOT}"/>
  <rect class="rim cupel" x="32" y="34" width="236" height="14" rx="7"/>
  <rect class="cap botel" x="120" y="8" width="60" height="38" rx="8"/>
  <path class="shine cupel" d="M58 70 L74 70 L92 380 L84 380 Z"/>
  <path class="shine botel" d="M84 150 L94 150 L96 380 L86 380 Z"/>
</svg>`;
}
function mix(a, b, t){
  const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
  const A = h(a), B = h(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
class Vessel{
  constructor(el, id){
    el.innerHTML = vessel(id); this.id = id;
    this.svg = el.querySelector("svg"); this.lvl = this.svg.querySelector(".lvl"); this.liq = this.svg.querySelector(".liq");
    this.grad = this.svg.querySelector("linearGradient"); this.gy = 340;
    this.stops = [...this.grad.querySelectorAll("stop")];
    if (reduce) this.svg.pauseAnimations();
    this.form = "cup"; this.pct = .92; this.apply();
  }
  setForm(f){ this.form = f; this.svg.dataset.form = f; this.liq.setAttribute("clip-path", `url(#${f === "cup" ? "cc" : "cb"}-${this.id})`); this.svg.classList.toggle("noice", f === "bottle"); this.apply(); }
  setLevel(p){ this.pct = p; this.apply(); }
  apply(){
    const [bottom, top] = this.form === "cup" ? [412, 58] : [414, 84];
    const y = bottom - this.pct * (bottom - top) + (this.pct === 0 ? 20 : 0);
    this.lvl.style.setProperty("--lt", `translateY(${y}px)`);
    this.lvl.style.transform = `translateY(${y}px)`;
    // o degradê vai da superfície até o fundo do copo/garrafa
    const to = Math.max(60, bottom - y), from = this.gy, t0 = performance.now();
    cancelAnimationFrame(this.raf);
    const step = t => { const k = reduce ? 1 : Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 3);
      this.gy = from + (to - from) * e; this.grad.setAttribute("y2", this.gy.toFixed(1)); if (k < 1) this.raf = requestAnimationFrame(step); };
    this.raf = requestAnimationFrame(step);
  }
  // cor lisa (água, chás) ou degradê real do Hype (sabor em cima, roxo/índigo embaixo)
  setColor(c, deep = false){
    this.setStops(deep ? [mix(c, "#ffffff", .2), c, c, mix(c, "#4b34c8", .64), "#1e1f7e"]
                       : [mix(c, "#ffffff", .15), c, c, mix(c, "#000000", .06), mix(c, "#000000", .14)]);
  }
  setStops(cols){ this.stops.forEach((st, i) => st.setAttribute("stop-color", cols[i])); }
  swirl(){ this.svg.classList.remove("swirl"); void this.svg.offsetWidth; this.svg.classList.add("swirl"); }
}

const hero = new Vessel($("#heroVessel"), "h");
const bv = new Vessel($("#buildVessel"), "b");
const mv = new Vessel($("#mcVessel"), "m");
const builder = {step:0};

const baseOf = id => BASES.find(b => b.id === id) || BASES[0];
const extraOf = id => EXTRAS.find(x => x.id === id);
// mistura das cores: a base pesa o dobro de cada sabor adicionado
function blend(cols, weights){
  const rgb = cols.map(c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)));
  const tot = weights.reduce((a, b) => a + b, 0);
  return "#" + [0, 1, 2].map(k => Math.round(rgb.reduce((a, c, i) => a + c[k] * weights[i], 0) / tot).toString(16).padStart(2, "0")).join("");
}
// degradê do líquido a partir dos ingredientes (a cor é só a representação da mistura)
function stopsFor(baseId, extras){
  const b = baseOf(baseId).c, ex = extras.map(id => extraOf(id).c);
  if (!ex.length) return [mix(b, "#ffffff", .24), b, mix(b, "#000000", .06), mix(b, "#4b34c8", .6), "#1e1f7e"];
  const all = blend([b, ...ex], [2, ...ex.map(() => 1)]);
  const last = ex[ex.length - 1];
  return [mix(b, "#ffffff", .22), mix(b, all, .45), all, mix(mix(all, last, .5), "#4b34c8", .5), "#1e1f7e"];
}
const gradCss = st => `linear-gradient(180deg,${st[0]} 0%,${st[1]} 28%,${st[2]} 55%,${st[3]} 80%,${st[4]} 100%)`;
const compName = (base, extras) => [baseOf(base).nome, ...extras.map(id => extraOf(id).nome)].join(" + ");

// estado do copo que está sendo montado
const mc = {base:"limao", extras:[], form:"bottle", qty:1, kit:"k6", pronto:true, editing:null};
const kitOf = id => KITS.find(k => k.id === id) || KITS[0];
const prodOf = id => PRODS.find(p => p.id === id);
$("#mcKits").innerHTML = KITS.map(k => `<button type="button" class="kitopt" data-k="${k.id}" aria-pressed="false"><b>${k.n}</b><span>sachês</span><em>${fmt(k.preco)}</em></button>`).join("");
$("#mcKits").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b){ mc.kit = b.dataset.k; renderMC(); } });
$("#mcPronto").addEventListener("change", e => { mc.pronto = e.target.checked; renderMC(); });

$("#heroBases").innerHTML = BASES.map(b => `<button type="button" class="bchip" data-b="${b.id}" aria-pressed="false"><i style="background:${gradCss(stopsFor(b.id, []))}"></i>${b.nome}</button>`).join("");
$("#mcBases").innerHTML = BASES.map(b => `<button type="button" class="base" data-b="${b.id}" aria-pressed="false"><i style="background:${gradCss(stopsFor(b.id, []))}"></i><span><b>${b.nome}</b><small>base</small></span></button>`).join("");
$("#heroBases").addEventListener("click", e => { const b = e.target.closest("[data-b]"); if (b) setBase(b.dataset.b); });
$("#mcBases").addEventListener("click", e => { const b = e.target.closest("[data-b]"); if (b) setBase(b.dataset.b); });
$("#mcExtras").addEventListener("click", e => {
  const x = e.target.closest("[data-x]"); if (!x) return;
  const id = x.dataset.x;
  if (mc.extras.includes(id)) mc.extras = mc.extras.filter(v => v !== id);
  else if (mc.extras.length < MAX_EXTRAS) mc.extras = [...mc.extras, id];
  else return; // já tem o máximo: os outros ficam bloqueados
  renderMC();
});
function setBase(id){ mc.base = id; mc.extras = mc.extras.filter(x => x !== id); renderMC(); }
// Delivery só sai na garrafa: se a pessoa tentar escolher copo em delivery, o site volta para garrafa e avisa
const modoDelivery = () => ($("#tgMode [aria-pressed=true]") || {dataset:{}}).dataset.v !== "Retirada";
const AVISO_COPO = "Você está em delivery: este copo vai como garrafa de 1L, pelo mesmo preço.";
let avisoT;
function avisoCopo(onde){
  clearTimeout(avisoT);
  ["#mcHint", "#heroAviso"].forEach(s => { const el = $(s); if (!el) return; el.hidden = s !== onde; if (s === onde) el.textContent = AVISO_COPO; });
  if (onde) avisoT = setTimeout(() => avisoCopo(null), 6000);
}
function setForm(f, origem){
  if (f === "cup" && modoDelivery()){
    f = "bottle";
    if (origem === "montador") avisoCopo("#mcHint");
    else if (origem === "topo") avisoCopo("#heroAviso");
  } else if (origem) avisoCopo(null);
  mc.form = f;
  renderMC();
}
$("#mcForm").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) setForm(b.dataset.v, "montador"); });
$("#mcMinus").onclick = () => { mc.qty = Math.max(1, mc.qty - 1); renderMC(); };
$("#mcPlus").onclick = () => { mc.qty = Math.min(30, mc.qty + 1); renderMC(); };

function renderMC(){
  const st = stopsFor(mc.base, mc.extras), b = baseOf(mc.base), F = FORMS[mc.form];
  document.documentElement.style.setProperty("--flav", b.c);
  [hero, mv].forEach(v => v.setStops(st));
  if (builder.step >= STEPS.length) bv.setStops(st);
  const vf = mc.form === "bottle" ? "bottle" : "cup";
  if (mv.form !== vf) mv.setForm(vf);
  if (hero.form !== vf) hero.setForm(vf);
  $$("button[data-form]").forEach(x => x.setAttribute("aria-pressed", x.dataset.form === vf));
  $$("[data-b]").forEach(x => x.setAttribute("aria-pressed", x.dataset.b === mc.base));
  $$("#mcForm [data-v]").forEach(x => x.setAttribute("aria-pressed", x.dataset.v === mc.form));
  const cheio = mc.extras.length >= MAX_EXTRAS;
  $("#mcExtras").innerHTML = EXTRAS.filter(x => x.id !== mc.base).map(x => {
    const on = mc.extras.includes(x.id);
    return `<button type="button" class="xchip" data-x="${x.id}" style="--c:${x.c}" aria-pressed="${on}"${cheio && !on ? " disabled" : ""}><i></i>${x.nome}</button>`;
  }).join("");
  $("#mcXmsg").textContent = cheio ? `Saborizante escolhido: ${extraOf(mc.extras[0]).nome}. É possível escolher apenas um saborizante: para trocar, desmarque e escolha outro.`
    : "Escolha 1 saborizante (opcional).";
  $("#mcXmsg").classList.toggle("cheio", cheio);
  // em delivery o botão Copo fica esmaecido (ao tocar, volta para garrafa e mostra o aviso)
  const emDelivery = modoDelivery();
  $$('#mcForm [data-v="cup"], button[data-form="cup"]').forEach(x => { x.classList.toggle("bloq", emDelivery); x.title = emDelivery ? "No delivery o Hype vai na garrafa" : ""; });
  const name = compName(mc.base, mc.extras), isKit = mc.form === "kit", K = kitOf(mc.kit);
  $("#flavName").textContent = name;
  $("#mcKit").hidden = !isKit;
  $$("#mcKits [data-k]").forEach(x => x.setAttribute("aria-pressed", x.dataset.k === mc.kit));
  $("#mcPronto").checked = mc.pronto;
  const cur = {form:mc.form, base:mc.base, extras:mc.extras, kit:mc.kit, pronto:mc.pronto, qty:mc.qty};
  $("#mcName").innerHTML = `${itemTitle(cur)} · <b></b>`; $("#mcName b").textContent = isKit && !mc.pronto ? "só sachês" : name;
  $("#mcQ").textContent = mc.qty;
  $("#mcSummary").textContent = isKit ? `${mc.qty}x Kit ${K.n} sachês${mc.pronto ? ` + drink pronto ${name}` : ""}` : `${mc.qty}x ${F.nome} · ${name}`;
  $("#mcPrice").textContent = fmt(priceOf(cur) * mc.qty);
  $("#mcMode").textContent = mc.editing ? "Editando item da sacola" : "Seu Hype";
  $("#mcAdd span").textContent = mc.editing ? "Salvar alterações" : "Adicionar à sacola";
  $("#mcCancel").hidden = !mc.editing;
}

$$("button[data-form]").forEach(b => b.addEventListener("click", () => {
  setForm(b.dataset.form, "topo");
  hero.svg.setAttribute("aria-label", b.dataset.form === "cup" ? "Copo de Hype Drink de 1 litro" : "Garrafa de Hype Drink de 1 litro");
}));

// tilt do copo com o mouse
const stage = $("#stage"), vwrap = $("#vwrap");
if (!reduce) stage.addEventListener("pointermove", e => {
  const r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  vwrap.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 10}deg)`;
});
stage.addEventListener("pointerleave", () => vwrap.style.transform = "");

/* ===== Monte em casa ===== */
const STEPS = [
  {t:"300 ml de água gelada",           d:"Água gelada no copo de 1 litro.", q:"300 ml", lv:.3, c:"#bfe4ff"},
  {t:"Herbal Concentrate",              d:"1 medida de 1,2 ml: chá verde, chá preto, malva, hibisco e cardamomo.", q:"1,2 ml", lv:.3, c:"#d9824a"},
  {t:"N.R.G.",                          d:"1 medida de 1,2 ml de chá preto e guaraná.", q:"1,2 ml", lv:.3, c:"#c46a36"},
  {t:"LiftOff",                         d:"1 sachê com cafeína, taurina, biotina, complexo B e vitamina C.", q:"1 sachê", lv:.3, c:null, fizz:true},
  {t:"CR7 Drive",                       d:"1 scoop de eletrólitos e vitaminas. Misture bem.", q:"1 scoop", lv:.3, c:null, swirl:true},
  {t:"Gelo até o topo",                 d:"Encha o copo de gelo.", q:"gelo", lv:.42, c:null, ice:true},
  {t:"Complete com Saborizante + Água", d:"Adicione água gelada e saborizante a gosto.", q:"700 ml", lv:.95, c:"flav", ice:true, swirl:true}
];
bv.svg.classList.add("noice"); bv.setLevel(0);
$("#steps").innerHTML = STEPS.map((s, i) => `<li class="step" data-i="${i + 1}"><span class="n">${String(i + 1).padStart(2, "0")}</span><div><b>${s.t}</b><span>${s.d}</span></div><span class="q">${s.q}</span></li>`).join("");
function goStep(n){
  builder.step = Math.max(0, Math.min(STEPS.length, n));
  const s = STEPS[builder.step - 1];
  let color = "#bfe4ff", flav = false, lv = 0, ice = false;
  for (let i = 0; i < builder.step; i++){
    const st = STEPS[i]; lv = st.lv; ice = !!st.ice;
    if (st.c === "flav") flav = true; else if (st.c) color = st.c;
  }
  if (flav) bv.setStops(stopsFor(mc.base, mc.extras)); else bv.setColor(color); bv.setLevel(lv); bv.svg.classList.toggle("noice", !ice);
  if (s && (s.swirl || s.fizz)) bv.swirl();
  $$(".step").forEach(li => { const i = +li.dataset.i; li.classList.toggle("done", i < builder.step); li.classList.toggle("cur", i === builder.step); });
  const ml = builder.step === 0 ? 0 : builder.step >= STEPS.length ? 1000 : 300;
  $("#bVol").textContent = ml; $("#bStep").textContent = String(builder.step).padStart(2, "0");
  $("#bMeter").style.width = (builder.step / STEPS.length * 100) + "%";
  $("#bNext").textContent = builder.step === 0 ? "Começar" : builder.step >= STEPS.length ? "Pedir meus sachês →" : "Próximo passo →";
  $("#bPrev").style.display = builder.step === 0 ? "none" : "";
}
$("#bNext").addEventListener("click", () => { if (builder.step >= STEPS.length) { setForm("kit"); rolarAte($("#monte-copo")); } else goStep(builder.step + 1); });
$("#bPrev").addEventListener("click", () => goStep(builder.step - 1));
$("#steps").addEventListener("click", e => { const li = e.target.closest(".step"); if (li) goStep(+li.dataset.i); });

/* ===== Tabela de ingredientes ===== */
const ING = [
  {sy:"Cv", nm:"Chá verde", g:"pl", k:"Planta · antioxidante", b:["Rico em antioxidantes que combatem os radicais livres","Melhora o desempenho físico","Ação diurética leve","Contribui para a saúde do coração"], c:"É considerado uma das bebidas mais saudáveis do planeta, cheio de nutrientes com efeitos poderosos no corpo."},
  {sy:"Cp", nm:"Chá preto", g:"pl", k:"Planta · disposição", b:["Dá mais disposição","Ajuda a desinchar","Melhora o humor","Ajuda a hidratar o organismo"], c:"Existem mais de 3 mil variedades. Ele também ajuda no controle do colesterol e faz bem ao coração."},
  {sy:"Ml", nm:"Malva", g:"pl", k:"Planta · detox", b:["Ação antioxidante","Efeito diurético natural","Aliada da saúde da pele","Reforça a imunidade"], c:"Tem propriedades anti-inflamatórias, calmantes e digestivas, e é muito usada para o aparelho respiratório."},
  {sy:"Hb", nm:"Hibisco", g:"pl", k:"Flor · diurético", b:["Ação diurética: ajuda a desinchar","Ajuda a reduzir a retenção de líquido","Melhora a digestão","Ajuda a regular o intestino"], c:"Os flavonoides do hibisco têm ação vasodilatadora e ajudam a regular o colesterol."},
  {sy:"Cd", nm:"Cardamomo", g:"pl", k:"Especiaria · sabor", b:["Dá sabor adocicado sem açúcar","Melhora a digestão","Ajuda a manter o hálito fresco","Favorece a circulação"], c:"Na medicina tradicional da Índia, o cardamomo é usado há séculos para melhorar a digestão."},
  {sy:"Gr", nm:"Guaraná", g:"pl", k:"Fruto · energia", b:["Aumenta o estado de alerta","Melhora a concentração e o raciocínio","Ajuda a aliviar o estresse","Mais disposição para estudo e trabalho"], c:"Tem cafeína, teobromina e teofilina, trio que acelera a velocidade de processamento da informação."},
  {sy:"Cf", nm:"Cafeína", g:"pl", k:"Estimulante · foco", b:["Reduz a sensação de cansaço","Melhora a função cerebral e a memória","Mais disposição pra rotina","Ajuda a manter o foco"], c:"Combate a fadiga e é responsável por desencadear aquela sensação de bem-estar."},
  {sy:"Ta", nm:"Taurina", g:"pl", k:"Aminoácido · performance", b:["Melhora o desempenho físico","Ajuda a controlar o estresse","Ação antioxidante","Promove sensação de bem-estar"], c:"É um nutriente importante para o funcionamento do sistema nervoso central e da imunidade."},
  {sy:"El", nm:"Eletrólitos", g:"pl", k:"Blend · hidratação", b:["Repõe sais minerais","Ajuda na disposição","Mantém a hidratação","Vem com vitaminas B1 e B12"], c:"Vêm do CR7 Drive e ajudam a repor o que o corpo perde no calor, na correria do dia ou no treino."},
  {sy:"B", nm:"Complexo B", g:"vit", k:"Vitaminas · energia", b:["Aumenta a energia","Melhora as funções do cérebro","Deixa cabelo e pele saudáveis","Melhora o humor"], c:"São oito vitaminas (B1, B2, B3, B5, B6, B7, B9 e B12) que fornecem energia para o corpo."},
  {sy:"B12", nm:"Vitamina B12", g:"vit", k:"Vitamina · energia", b:["Fornece força e energia","Ajuda a combater o cansaço","Protege o sistema nervoso","Contribui para o bom humor"], c:"Também chamada de cobalamina, tem papel importante na formação das células do sangue."},
  {sy:"C", nm:"Vitamina C", g:"vit", k:"Vitamina · imunidade", b:["Reforça a imunidade","Essencial na formação do colágeno","Melhora a absorção de ferro","Ajuda no bom humor"], c:"O corpo precisa dela mas não produz, por isso tem que vir da alimentação ou suplementação."},
  {sy:"Bt", nm:"Biotina", g:"vit", k:"Vitamina B7 · beleza", b:["Fortalece cabelo, pele e unhas","Ajuda a prevenir a queda de cabelo","Melhora o metabolismo","Formação de colágeno e queratina"], c:"Também conhecida como vitamina H, é essencial para a produção de proteínas e glicogênio."},
  {sy:"Mg", nm:"Magnésio", g:"vit", k:"Mineral · cansaço", b:["Reduz o cansaço","Bom para concentração e memória","Previne espasmos musculares","Mantém coração e músculos em dia"], c:"Ajuda a reduzir o estresse e a ansiedade, e ainda contribui para uma noite de sono melhor."},
  {sy:"K", nm:"Potássio", g:"vit", k:"Mineral · equilíbrio", b:["Equilibra a água no organismo","Favorece a atividade física","Ajuda a evitar câimbras","Ajuda a desinchar"], c:"Encontrado em legumes, verduras e frutas, é fundamental para músculos e pressão arterial."}
];
const els = $("#els"), detail = $("#detail");
ING.forEach((x, i) => {
  const b = document.createElement("button");
  b.className = "el"; b.type = "button"; b.dataset.g = x.g; b.setAttribute("role", "tab");
  b.innerHTML = `<span class="no">${String(i + 1).padStart(2, "0")}</span><span class="sy">${x.sy}</span><span class="nm">${x.nm}</span>`;
  b.addEventListener("click", () => showIng(i));
  els.appendChild(b);
});
function showIng(i){
  const x = ING[i];
  els.querySelectorAll(".el").forEach((e, j) => e.setAttribute("aria-selected", i === j));
  detail.innerHTML = `<div class="swap"><div class="top"><span class="sy">${x.sy}</span><span class="kind">${String(i + 1).padStart(2, "0")} / ${ING.length}<br>${x.k}</span></div>
    <h3 class="display">${x.nm}</h3><ul>${x.b.map(t => `<li>${t}</li>`).join("")}</ul>
    <div class="cur"><b>Curiosidade</b>${x.c}</div></div>`;
}
showIng(0);

/* ===== Sacola ===== */
const BAG_KEY = "hype_bag_v1";
let bag = [];
try {
  // a sacola salva pode ter sido mexida: só aceita valores das listas do site
  const salvo = JSON.parse(localStorage.getItem(BAG_KEY) || "[]");
  bag = (Array.isArray(salvo) ? salvo : []).filter(it => it && typeof it === "object" && Number.isInteger(it.qty) && it.qty >= 1 && it.qty <= 30 &&
    (it.form === "prod" ? !!prodOf(it.pid) : !!FORMS[it.form] && BASES.some(b => b.id === it.base)));
  bag.forEach(it => {
    if (typeof it.id !== "string" || !/^[a-z0-9]{1,20}$/i.test(it.id)) it.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    if (it.form === "prod"){ const P = prodOf(it.pid), ops = varNomes(P); if (!(ops && ops.includes(it.v))) it.v = ops ? ops[0] : undefined; return; }
    if (it.form === "kit"){ it.kit = kitOf(it.kit).id; if (typeof it.pronto !== "boolean") it.pronto = true; }
    it.extras = Array.isArray(it.extras) ? [...new Set(it.extras)].filter(x => x !== it.base && extraOf(x)).slice(0, MAX_EXTRAS) : [];
    if (!(it.form === "bottle" && Number.isInteger(it.copos) && it.copos > 0 && it.copos <= it.qty)) delete it.copos;
  });
} catch (e) { bag = []; }
const saveBag = () => { try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch (e) {} };
const keyOf = it => it.form === "prod" ? ["prod", it.pid, it.v || ""].join("|")
  : [it.form, it.base, [...it.extras].sort().join(","), it.form === "kit" ? `${it.kit}:${it.pronto ? 1 : 0}` : ""].join("|");
// preço unitário de qualquer item da sacola
function priceOf(it){
  if (it.form === "prod") return prodPreco(prodOf(it.pid), it.v);
  if (it.form === "kit") return kitOf(it.kit).preco;
  return FORMS[it.form].preco;
}
// título do item; no delivery o drink sai sempre na garrafa
function itemTitle(it, deliv = false){
  if (it.form === "prod") { const P = prodOf(it.pid); return P.nome + (it.v ? ` · ${it.v}` : ""); }
  if (it.form === "kit") return `Kit ${kitOf(it.kit).n} sachês`;
  return FORMS[deliv ? "bottle" : it.form].nome;
}
function itemDesc(it){
  if (it.form === "prod") return prodOf(it.pid).det;
  if (it.form === "kit") return `Com garrafa, copo e canudos${it.pronto ? ` + 1 drink pronto: ${compName(it.base, it.extras)}` : ""}`;
  return compName(it.base, it.extras);
}
const isDeliv = () => { const b = $("#tgMode [aria-pressed=true]"); return !b || b.dataset.v === "Delivery"; };
function bagTotals(){
  let sum = 0, n = 0;
  bag.forEach(it => { n += it.qty; sum += priceOf(it) * it.qty; });
  return {sum, n, txt: fmt(sum)};
}
// Delivery: tudo vai na garrafa. Os copos da sacola viram garrafas ("copos" guarda quantos eram copo)
// e voltam a ser copo se a pessoa escolher retirar, para não precisar montar o pedido de novo.
function juntarIguais(){
  const vistos = new Map();
  bag = bag.filter(it => {
    const k = keyOf(it), t = vistos.get(k);
    if (!t){ vistos.set(k, it); return true; }
    t.qty = Math.min(30, t.qty + it.qty);
    if (it.copos) t.copos = Math.min(t.qty, (t.copos || 0) + it.copos);
    return false;
  });
}
function ajustarFormato(){
  let mudou = false;
  if (isDeliv()){
    bag.forEach(it => { if (it.form === "cup"){ it.form = "bottle"; it.copos = it.qty; mudou = true; } });
  } else {
    bag.slice().forEach(it => {
      if (it.form !== "bottle" || !it.copos) return;
      const c = Math.min(it.copos, it.qty); delete it.copos; mudou = true;
      if (c >= it.qty) it.form = "cup";
      else { it.qty -= c; bag.push({id:Date.now().toString(36) + Math.random().toString(36).slice(2, 6), form:"cup", base:it.base, extras:[...it.extras], qty:c}); }
    });
  }
  if (mudou){ juntarIguais(); saveBag(); }
}
function renderBag(){
  ajustarFormato();
  const T = bagTotals(), deliv = isDeliv();
  const viraram = deliv ? bag.reduce((s, it) => s + (it.form === "bottle" && it.copos ? it.copos : 0), 0) : 0;
  $("#bag").innerHTML = (viraram ? `<div class="bagconv">🛵 Delivery: ${viraram} ${viraram > 1 ? "copos foram" : "copo foi"} para a garrafa de 1L, pelo mesmo preço. Se escolher <b>Retirar</b>, ${viraram > 1 ? "voltam" : "volta"} a ser copo.</div>` : "") + (bag.length ? bag.map(it => {
    const sw = it.form === "prod" ? `<img class="sw ph" src="${prodImg(prodOf(it.pid), it.v)}" alt="" width="28" height="35">`
      : `<i class="sw" style="background:${gradCss(stopsFor(it.base, it.extras))}"></i>`;
    return `<div class="bitem" data-id="${it.id}">
      ${sw}
      <div class="bi"><b>${itemTitle(it)}</b><span>${itemDesc(it)}</span>${it.copos ? `<span class="swp">Era copo: no delivery vai na garrafa</span>` : ""}
        <div class="bia">${it.form === "prod" ? "" : `<button type="button" data-act="edit">Editar</button>`}<button type="button" data-act="rm">Remover</button></div></div>
      <div class="bq"><button type="button" data-act="dec" aria-label="Diminuir">−</button><output>${it.qty}</output><button type="button" data-act="inc" aria-label="Aumentar">+</button></div>
      <b class="bp">${fmt(priceOf(it) * it.qty)}</b></div>`;
  }).join("") : `<div class="bagempty">Sua sacola está vazia. <a href="#monte-copo">Monte seu primeiro copo</a></div>`);
  $("#total").textContent = T.txt;
  $("#bagCount").textContent = T.n;
  $("#mLabel").textContent = T.n ? `Sacola · ${T.n} ${T.n > 1 ? "itens" : "item"}` : "1 litro a partir de";
  $("#mPrice").textContent = T.n ? T.txt : fmt(FORMS.cup.preco);
  $("#mBtn").textContent = T.n ? "Finalizar pedido" : "Monte seu copo";
  $("#mBtn").setAttribute("href", T.n ? "#pedido" : "#monte-copo");
}
$("#bag").addEventListener("click", e => {
  const btn = e.target.closest("[data-act]"); if (!btn) return;
  const id = btn.closest(".bitem").dataset.id, it = bag.find(x => x.id === id); if (!it) return;
  const act = btn.dataset.act;
  if (act === "inc") it.qty = Math.min(30, it.qty + 1);
  if (act === "dec") { if (it.qty > 1) it.qty--; else bag = bag.filter(x => x !== it); }
  if (act === "rm") bag = bag.filter(x => x !== it);
  if (act === "edit") {
    Object.assign(mc, {base:it.base, extras:[...it.extras], form:it.form, qty:it.qty, editing:it.id});
    if (it.form === "kit") Object.assign(mc, {kit:it.kit, pronto:it.pronto});
    renderMC(); $("#mcToast").hidden = true;
    rolarAte($("#monte-copo"));
    return;
  }
  if (mc.editing && !bag.some(x => x.id === mc.editing)) { mc.editing = null; renderMC(); }
  saveBag(); renderBag();
});
function toast(html){
  const t = $("#mcToast"); t.innerHTML = html; t.hidden = false;
}
$("#mcAdd").addEventListener("click", () => {
  const item = {form:mc.form, base:mc.base, extras:[...mc.extras], qty:mc.qty};
  if (mc.form === "kit") Object.assign(item, {kit:mc.kit, pronto:mc.pronto});
  const key = keyOf(item);
  let msg;
  if (mc.editing){
    const cur = bag.find(x => x.id === mc.editing);
    const twin = bag.find(x => x !== cur && keyOf(x) === key);
    if (twin){ twin.qty = Math.min(30, twin.qty + item.qty); bag = bag.filter(x => x !== cur); }
    else if (cur) Object.assign(cur, item);
    else bag.push({id:Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...item});
    msg = "Item atualizado na sacola.";
  } else {
    const twin = bag.find(x => keyOf(x) === key);
    if (twin) twin.qty = Math.min(30, twin.qty + item.qty);
    else bag.push({id:Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...item});
    msg = item.form === "kit" ? `${itemTitle(item)} adicionado à sacola!` : `${FORMS[item.form].nome} de ${compName(item.base, item.extras)} adicionado à sacola!`;
  }
  saveBag(); renderBag();
  Object.assign(mc, {extras:[], qty:1, editing:null}); renderMC();
  toast(`<span></span><div><button type="button" class="btn ghost sm" data-t="again">Montar outro</button><a class="btn sm" href="#pedido">Ver sacola (${bagTotals().n})</a></div>`);
  $("#mcToast span").textContent = msg;
});
$("#mcToast").addEventListener("click", e => {
  if (e.target.closest("[data-t=again]")) { $("#mcToast").hidden = true; rolarAte($("#monte-copo")); }
  if (e.target.closest("a")) $("#mcToast").hidden = true;
});
/* ===== Produtos Herbalife ===== */
// pSel: opção escolhida em cada card. Produtos com "escolher" (LiftOff) começam sem sabor marcado
// e mostram as fotos dos sabores em carrossel até a pessoa escolher um.
const pSel = {};
$("#pgrid").innerHTML = PRODS.map(p => {
  const ops = varNomes(p);
  if (ops && !p.escolher) pSel[p.id] = ops[0];
  const fotos = p.imgs ? ops.map((v, i) => `<img src="${p.imgs[v]}" alt="${p.nome} sabor ${v} Herbalife" data-v="${v}" class="${i ? "" : "on"}" width="720" height="900" loading="lazy">`).join("")
    : `<img src="${p.img}" alt="${p.nome} Herbalife" width="720" height="900" loading="lazy">`;
  return `<article class="pcard rv" data-p="${p.id}">
    <figure${p.imgs ? ' class="fotos"' : ""}>${fotos}</figure>
    <div class="pb"><span class="tag">Herbalife</span><h3>${p.nome}</h3><p>${p.det}</p>
      ${ops ? `<div class="pv" role="group" aria-label="${p.varNome}">${ops.map(v => `<button type="button" data-v="${v}" aria-pressed="${pSel[p.id] === v}">${v}</button>`).join("")}</div>` : ""}
      <div class="pf"><b>${fmt(prodPreco(p, ops && ops[0]))}</b><button type="button" class="btn sm" data-add><svg viewBox="0 0 24 24"><use href="#i-bag"/></svg><span>Adicionar</span></button></div>
    </div></article>`;
}).join("");
$("#pgrid").addEventListener("click", e => {
  const card = e.target.closest(".pcard"); if (!card) return;
  const pid = card.dataset.p, vb = e.target.closest(".pv [data-v]");
  if (vb){
    pSel[pid] = vb.dataset.v; $$(`.pcard[data-p=${pid}] .pv button`).forEach(x => x.setAttribute("aria-pressed", x === vb));
    card.querySelector(".pf b").textContent = fmt(prodPreco(prodOf(pid), pSel[pid]));
    card.querySelector(".pv").classList.remove("pede");
    if (card._carrossel){ clearInterval(card._carrossel); card._carrossel = 0; }
    mostraFoto(card, pSel[pid]);
    return;
  }
  const add = e.target.closest("[data-add]"); if (!add) return;
  if (prodOf(pid).escolher && !pSel[pid]){
    // ainda não escolheu o sabor: destaca as opções em vez de adicionar
    const pv = card.querySelector(".pv"); pv.classList.remove("pede"); void pv.offsetWidth; pv.classList.add("pede");
    add.querySelector("span").textContent = "Escolha o sabor";
    clearTimeout(add._t); add._t = setTimeout(() => { add.querySelector("span").textContent = "Adicionar"; }, 1600);
    return;
  }
  const item = {form:"prod", pid, v:pSel[pid] || "", qty:1};
  const twin = bag.find(x => keyOf(x) === keyOf(item));
  if (twin) twin.qty = Math.min(30, twin.qty + 1);
  else bag.push({id:Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...item});
  saveBag(); renderBag();
  add.classList.add("done"); add.querySelector("span").textContent = "Na sacola ✓";
  clearTimeout(add._t); add._t = setTimeout(() => { add.classList.remove("done"); add.querySelector("span").textContent = "Adicionar"; }, 1600);
});
// troca a foto visível do card (as fotos ficam empilhadas e mudam com fade)
function mostraFoto(card, v){
  card.querySelectorAll("figure.fotos img").forEach(img => img.classList.toggle("on", img.dataset.v === v));
}
// carrossel das fotos dos sabores: só roda com o card na tela e enquanto nenhum sabor foi escolhido
const vistaCarrossel = new IntersectionObserver(es => es.forEach(en => {
  const card = en.target, pid = card.dataset.p;
  if (en.isIntersecting && !pSel[pid] && !card._carrossel){
    card._carrossel = setInterval(() => {
      const fotos = [...card.querySelectorAll("figure.fotos img")];
      const i = fotos.findIndex(f => f.classList.contains("on"));
      mostraFoto(card, fotos[(i + 1) % fotos.length].dataset.v);
    }, 2200);
  } else if (!en.isIntersecting && card._carrossel){ clearInterval(card._carrossel); card._carrossel = 0; }
}), {threshold:.25});
$$(".pcard").forEach(card => { if (card.querySelector("figure.fotos")) vistaCarrossel.observe(card); });

$("#mcCancel").addEventListener("click", () => { Object.assign(mc, {extras:[], qty:1, editing:null}); renderMC(); });

/* ===== Pedido ===== */
const tgVal = id => $(`#${id} [aria-pressed=true]`).dataset.v;
function toggleGroup(id, cb){
  $(`#${id}`).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$(`#${id} button`).forEach(x => x.setAttribute("aria-pressed", x === b)); cb && cb(b.dataset.v);
  });
}
// Regras de pagamento: Pix e cartão são pagos online (InfinitePay); dinheiro só na retirada
const pressTg = (id, val) => $$(`#${id} button`).forEach(x => x.setAttribute("aria-pressed", x.dataset.v === val));
const isOnlinePay = v => PAGAMENTO_ONLINE && v !== "Dinheiro";
function onMode(v){
  $("#addrBox").hidden = v !== "Delivery";
  $("#modeNote").textContent = v === "Delivery" ? "No delivery tudo vai na garrafa de 1L: copos da sacola viram garrafa, pelo mesmo preço."
    : "Na retirada você leva no copo ou na garrafa, como montou.";
  $("#taxaNote").hidden = $("#totEntrega").hidden = v !== "Delivery";
  $("#recvTxt").textContent = v === "Delivery" ? "Delivery" : "Retirada no local";
  $("#recvTroca").textContent = v === "Delivery" ? "Trocar para Retirar" : "Trocar para Delivery";
  if (v === "Delivery" && mc.form === "cup") mc.form = "bottle"; // delivery só na garrafa
  if (v !== "Delivery") avisoCopo(null);
  if (v === "Delivery" && tgVal("tgPay") === "Dinheiro"){ pressTg("tgPay", "Pix"); onPay("Pix"); }
  renderBag(); renderMC();
}
toggleGroup("tgMode", onMode);
// no formulário do pedido: atalho para trocar a forma de receber (o seletor fica no Monte seu copo)
$("#recvTroca").addEventListener("click", () => $(`#tgMode button[data-v="${modoDelivery() ? "Retirada" : "Delivery"}"]`).click());
const PAY_NOTES = PAGAMENTO_ONLINE
  ? {Pix:"Pague agora com Pix no checkout seguro da InfinitePay.", "Cartão":"Pague agora com cartão de crédito no checkout seguro da InfinitePay.", Dinheiro:"Dinheiro só na retirada: você paga quando buscar o pedido."}
  : {Pix:"Pix na entrega ou na retirada.", "Cartão":"Cartão na entrega ou na retirada.", Dinheiro:"Dinheiro na retirada."};
function onPay(v){
  if (v === "Dinheiro" && tgVal("tgMode") === "Delivery"){ pressTg("tgMode", "Retirada"); onMode("Retirada"); }
  $("#trocoField").hidden = v !== "Dinheiro"; $("#obsField").hidden = v === "Dinheiro";
  $("#payNote").textContent = PAY_NOTES[v] || "";
  const online = isOnlinePay(v);
  $("#oSubmit span").textContent = online ? "Ir para o pagamento" : "Enviar pedido";
  $("#oSubmit use").setAttribute("href", online ? "#i-lock" : "#i-wa");
  $("#oNote").firstChild.textContent = online ? "Você paga no checkout da InfinitePay e, ao voltar pro site, envia o pedido já pago no WhatsApp da Hype. " : "A mensagem abre pronta no WhatsApp da Hype e você paga em dinheiro na retirada. ";
}
toggleGroup("tgPay", onPay);
onPay("Pix");
const oErr = $("#oErr");
// CEP: ao digitar os 8 números, busca no ViaCEP e preenche rua, bairro e cidade
let cepSeq = 0;
$("#aCep").addEventListener("input", e => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 8);
  e.target.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  const st = $("#cepSt"), msg = $("#cepMsg");
  st.className = "cepst"; msg.textContent = ""; msg.className = "cepmsg";
  if (d.length === 8) buscaCep(d);
});
async function buscaCep(cep){
  const seq = ++cepSeq, st = $("#cepSt"), msg = $("#cepMsg");
  st.className = "cepst load";
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {signal: ctl.signal});
    clearTimeout(t);
    const d = await r.json();
    if (seq !== cepSeq) return;
    if (!r.ok || d.erro) throw new Error("nao");
    const set = (id, val) => { if (val){ $(id).value = val; $(id).classList.remove("invalid"); } };
    set("#aRua", d.logradouro); set("#aBairro", d.bairro); set("#aCid", `${d.localidade}/${d.uf}`);
    st.className = "cepst ok"; msg.textContent = ""; msg.className = "cepmsg";
    if (!d.logradouro){ msg.textContent = "CEP da cidade inteira: digite a rua e o bairro."; $("#aRua").focus(); }
    else $("#aNum").focus();
  } catch (err) {
    if (seq !== cepSeq) return;
    st.className = "cepst";
    msg.className = "cepmsg bad";
    msg.innerHTML = 'Não encontramos esse CEP. Confira os números ou preencha o endereço à mão. <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener">Não sei meu CEP</a>';
  }
}
function oInvalid(el, msg){ $$(".oform .invalid").forEach(x => x.classList.remove("invalid")); el.classList.add("invalid"); el.focus(); oErr.textContent = msg; return false; }
$("#orderForm").addEventListener("input", e => { e.target.classList.remove("invalid"); oErr.textContent = ""; });
$("#orderForm").addEventListener("submit", e => {
  e.preventDefault();
  const v = id => $(id).value.trim();
  const mode = tgVal("tgMode"), pay = tgVal("tgPay"), delivery = mode === "Delivery";
  if (!bag.length){ oErr.textContent = "Sua sacola está vazia. Monte seu copo e adicione à sacola antes de enviar."; rolarAte($("#bag"), "center"); return; }
  if (!v("#oname")) return oInvalid($("#oname"), "Digite seu nome.");
  if (delivery){
    if (v("#aCep").replace(/\D/g, "").length !== 8) return oInvalid($("#aCep"), "Digite o CEP com 8 números.");
    if (!v("#aCid")) return oInvalid($("#aCid"), "Digite a cidade.");
    if (!v("#aRua")) return oInvalid($("#aRua"), "Digite a rua da entrega.");
    if (!v("#aNum")) return oInvalid($("#aNum"), "Digite o número.");
    if (!v("#aBairro")) return oInvalid($("#aBairro"), "Digite o bairro.");
  }
  const T = bagTotals();
  const L = [
    "*⚡ NOVO PEDIDO · HYPE DRINK*", "",
    `👤 *Cliente:* ${v("#oname")}`, "",
    "*🥤 Pedido*",
    ...bag.map((it, i) => `${i + 1}. ${it.qty}x ${itemTitle(it, delivery && it.form === "cup")}${it.form === "prod" ? " (Herbalife)" : `: ${itemDesc(it)}`} · ${fmt(priceOf(it) * it.qty)}`), "",
    `💰 *Total:* ${fmt(T.sum)}`,
    `💳 *Pagamento:* ${isOnlinePay(pay) ? `${pay === "Cartão" ? "Cartão de crédito" : "Pix"} online (InfinitePay)` : pay === "Dinheiro" ? "Dinheiro na retirada" : pay}${pay === "Dinheiro" && v("#troco") ? ` (troco para ${v("#troco")})` : ""}`, ""
  ];
  if (delivery){
    L.push("*🛵 Entrega*",
      `${v("#aRua")}, nº ${v("#aNum")}${v("#aComp") ? ` · ${v("#aComp")}` : ""}`,
      `Bairro: ${v("#aBairro")}`,
      `${v("#aCid")} · CEP ${v("#aCep")}`);
    if (v("#aRef")) L.push(`Referência: ${v("#aRef")}`);
    L.push(`🛵 *Taxa de entrega:* a combinar com a Hype pelo WhatsApp (não está no total${isOnlinePay(pay) ? " nem no pagamento online" : ""})`);
  } else {
    L.push("*🏪 Retirada no local*");
  }
  if (pay !== "Dinheiro" && v("#obs")) L.push("", `📝 *Obs.:* ${v("#obs")}`);
  L.push("", "_Pedido enviado pelo site_");
  if (isOnlinePay(pay)) return payOnline(L, delivery, v("#oname"));
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(L.join("\n"))}`, "_blank");
});
// Pagamento online: o servidor (Cloudflare Pages Function, pasta functions/api) calcula o valor e cria o link da InfinitePay
let paying = false;
// Ao voltar do checkout pelo botão "voltar", o navegador restaura a página congelada: destrava o botão
addEventListener("pageshow", () => {
  paying = false;
  onPay(tgVal("tgPay"));
});
async function payOnline(L, delivery, nome){
  if (paying) return; paying = true;
  const btn = $("#oSubmit span"); btn.textContent = "Gerando pagamento…";
  try {
    const items = bag.map(({form, base, extras, kit, pronto, pid, v, qty}) => ({form, base, extras, kit, pronto, pid, v, qty}));
    const r = await fetch("/api/checkout", {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({delivery, nome, items})});
    const d = await r.json().catch(() => ({}));
    if (r.status === 429) throw new Error("Muitas tentativas seguidas. Aguarde um minuto.");
    if (!r.ok || !d.url) throw new Error(d.erro || "Não foi possível gerar o pagamento agora.");
    // itens e forma de recebimento vão no link de conferência que a equipe abre (obrigado.html)
    try { localStorage.setItem("hype_pending_v1", JSON.stringify({nsu:d.nsu, msg:L.join("\n"), total:d.total, items, delivery, em:Date.now()})); } catch (e) {}
    location.href = d.url;
  } catch (e) {
    oErr.textContent = `${e.message} Tente de novo em instantes ou escolha Dinheiro na retirada.`;
    btn.textContent = "Ir para o pagamento"; paying = false;
  }
}

/* ===== Simulador (trabalhe conosco) ===== */
const sim = {c:10, d:30};
function paint(r){ r.style.setProperty("--v", ((r.value - r.min) / (r.max - r.min) * 100) + "%"); }
$("#qpick").innerHTML = [10, 20, 75, 100].map(n => `<button type="button" data-n="${n}"><b>${n} hypes/dia</b><span>${fmt0(n * 30 * LUCRO_HYPE)}/mês</span></button>`).join("");
$("#qpick").addEventListener("click", e => {
  const b = e.target.closest("[data-n]"); if (!b) return;
  sim.c = +b.dataset.n; sim.d = 30;
  $("#rC").value = sim.c; $("#rD").value = sim.d; paint($("#rC")); paint($("#rD")); updSim();
});
function updSim(){
  const n = sim.c * sim.d;
  $("#vC").textContent = sim.c; $("#vD").textContent = sim.d;
  $("#oF").textContent = fmt0(n * FORMS.cup.preco); $("#oFd").textContent = `${n.toLocaleString("pt-BR")} hypes a ${fmt0(FORMS.cup.preco)}`;
  $("#oL").textContent = fmt0(n * LUCRO_HYPE);
  $$("#qpick button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.n === sim.c && sim.d === 30));
}
[["#rC","c"],["#rD","d"]].forEach(([s, k]) => { const r = $(s); paint(r); r.addEventListener("input", () => { sim[k] = +r.value; paint(r); updSim(); }); });
updSim();

/* ===== Cadastro (trabalhe conosco) ===== */
let sStep = 0;
const fsteps = $$(".fstep"), sErr = $("#sErr");
$("#sZap").addEventListener("input", e => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 11);
  e.target.value = d.length > 6 ? `(${d.slice(0,2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0,2)}) ${d.slice(2)}` : d;
});
function invalid(el, msg){ if (el){ el.classList.add("invalid"); el.focus(); } sErr.textContent = msg; return false; }
function validate(n){
  sErr.textContent = ""; $$(".invalid").forEach(x => x.classList.remove("invalid"));
  if (n === 0){
    if ($("#sNome").value.trim().length < 3) return invalid($("#sNome"), "Digite seu nome completo.");
    if ($("#sZap").value.replace(/\D/g, "").length < 10) return invalid($("#sZap"), "Digite um WhatsApp com DDD.");
  }
  if (n === 1){
    if (!$("#sCidade").value.trim()) return invalid($("#sCidade"), "Qual a sua cidade?");
    if ($("#sUF").value.trim().length !== 2) return invalid($("#sUF"), "Digite a UF com 2 letras.");
    if (!$("input[name=sMod]:checked")) return invalid(null, "Escolha onde você quer vender.");
  }
  if (n === 2 && !$("#sOk").checked) return invalid(null, "Marque a autorização de contato para enviar.");
  return true;
}
function showS(n){
  sStep = n;
  fsteps.forEach((f, i) => f.classList.toggle("on", i === n));
  $$("#sProg > div").forEach((d, i) => d.classList.toggle("on", i <= n));
  $("#sBack").style.visibility = n ? "visible" : "hidden";
  $("#sNext").textContent = n === 2 ? "Enviar cadastro" : "Continuar →";
  sErr.textContent = "";
}
$("#sBack").addEventListener("click", () => showS(sStep - 1));
$("#sNext").addEventListener("click", () => {
  if (!validate(sStep)) return;
  if (sStep < 2) return showS(sStep + 1);
  const v = id => $(id).value.trim(), r = n => ($(`input[name=${n}]:checked`) || {}).value || "-";
  const proto = "HT-" + Date.now().toString(36).toUpperCase().slice(-6);
  const msg = [
    "*TRABALHE CONOSCO · HYPE DRINK*", `Protocolo: ${proto}`, "",
    `Nome: ${v("#sNome")}`, `WhatsApp: ${v("#sZap")}`, `Instagram: ${v("#sInsta") || "-"}`,
    `Cidade: ${v("#sCidade")}/${v("#sUF").toUpperCase()}`, `Bairro: ${v("#sBairro") || "-"}`,
    `Quer vender: ${r("sMod")}`, `Experiência: ${r("sExp")}`, `Começar: ${r("sQuando")}`,
    `Simulação: ${sim.c} hypes/dia · ${sim.d} dias → lucro estimado ${$("#oL").textContent}/mês`,
    v("#sMsg") ? `\nSobre: ${v("#sMsg")}` : ""
  ].join("\n");
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  const first = v("#sNome").split(" ")[0].replace(/[<>&"]/g, "");
  window.open(url, "_blank");
  $("#sfBody").innerHTML = `<div class="ok swap"><div class="badge"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg></div>
    <span class="mono">Protocolo ${proto}</span><h3 class="display">Cadastro pronto, ${first}!</h3>
    <p>Abrimos o WhatsApp com os seus dados. É só tocar em enviar que a equipe Hype te chama pra explicar como funciona.</p>
    <a class="btn" href="${url}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><use href="#i-wa"/></svg>Abrir WhatsApp de novo</a></div>`;
});

/* ===== Rolagem suave (igual no celular e no computador) ===== */
// O scroll-behavior:smooth do CSS não anima em vários celulares (Safari antigo, modo economia de bateria,
// "remover animações"). A animação é feita aqui, quadro a quadro; o alvo é recalculado a cada quadro.
let rolagem = 0;
function rolarAte(el, block = "start"){
  if (!el) return;
  const alvo = () => {
    const r = el.getBoundingClientRect();
    const y = scrollY + r.top - (block === "center" ? (innerHeight - r.height) / 2 : 0);
    return Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
  };
  const ini = scrollY, dist0 = Math.abs(alvo() - ini);
  if (dist0 < 2) return;
  const dur = Math.min(1100, Math.max(450, dist0 * 0.22)) * (reduce ? 0.5 : 1);
  const html = document.documentElement, t0 = performance.now(), id = ++rolagem;
  html.style.scrollBehavior = "auto"; // evita o CSS brigar com a animação
  const passo = t => {
    if (id !== rolagem) return;
    const p = Math.min(1, (t - t0) / dur), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    scrollTo(0, ini + (alvo() - ini) * e);
    if (p < 1) requestAnimationFrame(passo); else html.style.scrollBehavior = "";
  };
  requestAnimationFrame(passo);
}
// se a pessoa tocar ou rolar no meio da animação, ela para
const pararRolagem = () => { rolagem++; document.documentElement.style.scrollBehavior = ""; };
["wheel", "touchstart", "keydown"].forEach(ev => addEventListener(ev, pararRolagem, {passive:true}));
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const hash = a.getAttribute("href");
  const el = hash.length > 1 && document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!el) return;
  e.preventDefault();
  if (location.hash !== hash) history.pushState(null, "", hash);
  rolarAte(el);
});

/* ===== Interações gerais ===== */
const counters = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return; counters.unobserve(en.target);
  const el = en.target, end = +el.dataset.count, t0 = performance.now();
  if (reduce) { el.textContent = end; return; }
  const tick = t => { const k = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}));
$$("[data-count]").forEach(el => counters.observe(el));
if (!reduce && matchMedia("(pointer:fine)").matches) $$("[data-tilt]").forEach(t => {
  t.addEventListener("pointermove", e => { const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; t.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`; });
  t.addEventListener("pointerleave", () => t.style.transform = "");
});
const cg = $("#cglow");
addEventListener("pointermove", e => cg.style.transform = `translate(${e.clientX}px,${e.clientY}px)`, {passive:true});
const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } }), {threshold:.12});
$$(".rv").forEach(el => io.observe(el));
// barra fixa do celular: some nas seções que já têm os próprios botões (monte, pedido, trabalhe) e no rodapé
const ctaZones = $$("#monte-copo,#produtos,#pedido,#trabalhe,footer"), mcta = $("#mcta");
let scrollTick = 0;
function onScroll(){
  scrollTick = 0;
  const h = document.documentElement.scrollHeight - innerHeight;
  $("#progress").style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  const vh = innerHeight;
  const inZone = ctaZones.some(s => { const r = s.getBoundingClientRect(); return r.top < vh + 40 && r.bottom > 0; });
  const show = scrollY > 700 && !inZone;
  if (show !== mcta.classList.contains("show")) mcta.classList.toggle("show", show);
}
const queueScroll = () => { if (!scrollTick) scrollTick = requestAnimationFrame(onScroll); };
addEventListener("scroll", queueScroll, {passive:true});
addEventListener("resize", queueScroll, {passive:true});
onScroll();
// faixa: repete as palavras até cobrir a tela inteira (inclusive com zoom reduzido)
const mqTrack = $(".marquee .track"), mqBase = mqTrack.innerHTML;
let mqW = 0;
function buildMarquee(force){
  if (!force && innerWidth === mqW) return; mqW = innerWidth;
  mqTrack.innerHTML = mqBase;
  const w = mqTrack.scrollWidth || 1, n = Math.ceil(innerWidth / w) + 1;
  const half = mqBase.repeat(n);
  mqTrack.innerHTML = half + half;
  mqTrack.style.animationDuration = (w * n / 45) + "s";
}
buildMarquee(true); document.fonts.ready.then(() => buildMarquee(true));
addEventListener("resize", () => { clearTimeout(buildMarquee.t); buildMarquee.t = setTimeout(buildMarquee, 150); });
renderMC(); renderBag(); goStep(0);
// aviso de cookies: só armazenamento essencial; a escolha fica salva neste navegador
const CK = "hype_cookies_v1";
let ckSaved = null; try { ckSaved = localStorage.getItem(CK); } catch (e) {}
if (!ckSaved) $("#cookie").hidden = false;
$("#cookieOk").addEventListener("click", () => {
  try { localStorage.setItem(CK, JSON.stringify({essenciais:true, analise:false, em:new Date().toISOString()})); } catch (e) {}
  $("#cookie").hidden = true;
});
