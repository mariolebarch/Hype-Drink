# Hype Drink

Site da Hype Drink: bebida funcional energética de 1 litro (copo, garrafa e sachês), pedidos pelo WhatsApp, pagamento online (InfinitePay) e cadastro de revendedores.

- `public/`: o site publicado (HTML, CSS, JavaScript em `public/assets/*.js` e fotos)
- `functions/api/`: funções do servidor (Cloudflare Pages Functions) para o pagamento online
- `lib/catalogo.js`: preços usados pelo servidor (manter igual a `public/assets/site.js`)

Hospedado no Cloudflare Pages a partir da branch `main`: sem comando de build, pasta de saída `public`.

Criado e acompanhado por BARCHMIND.
