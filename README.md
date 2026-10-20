# Felipe & Ingrid — lista de presentes

Versão estática em Next.js, com reservas no Supabase e contribuição por Pix. O conteúdo foi preparado para ser publicado por envio manual da pasta compilada, sem funções no servidor da Netlify.

## Publicar a versão pronta

Use a pasta `publicar` do pacote. Entre na Netlify e arraste essa pasta para https://app.netlify.com/drop.

## Editar e recompilar

Requer Node.js 22.13 ou superior. Na pasta `codigo-fonte`:

```sh
npm install
npm run build
```

O comando gera `out/`. Envie o conteúdo dessa pasta à Netlify para atualizar a versão publicada. Não envie o código-fonte esperando que as reservas sejam atendidas por uma rota `/api`: nesta versão, o navegador fala diretamente com a Edge Function do Supabase.

## Onde editar

- `lib/delivery.json`: destinatário e endereço. Use `null` enquanto o endereço não estiver confirmado.
- `lib/products.json`: nomes, preços, imagens, links e lembretes de voltagem.
- `public/assets/products`: fotos dos presentes.
- `app/globals.css`: cores, tipografia e layout.
- `app/page-markup.ts`: conteúdo das seções estáticas.
- `app/catalogue.tsx`: interface de busca e reserva.
- `lib/reservations.ts`: chamadas à função remota.

## Reservas

A função `wedding-if-reservations` já está publicada no projeto Supabase `veste-bem-testes`. Ela aceita chamadas de navegadores em outros domínios por CORS, mantendo a verificação JWT e as regras de reserva exclusiva. Não é necessário reimplantar a função ao subir o site na Netlify.

`lib/supabase-public.json` contém somente a URL do projeto e sua chave **pública anon**, exigida pelo gateway. A chave privilegiada de serviço é fornecida pelo ambiente da Edge Function, nunca pelo navegador ou pelo ZIP. A tabela `public.wedding_if_reservations` tem RLS e nega acesso direto a visitantes; a função devolve somente IDs e estados das reservas, sem nomes ou hashes.

O cancelamento depende do segredo aleatório criado no navegador. Só o hash é salvo no banco. Mudar de domínio ou apagar o armazenamento do navegador perde essa identificação local. Os IDs de presentes permitidos hoje são `gift-01` a `gift-22`; adicionar mais itens exige atualizar também a validação da função e a restrição da tabela.

A pasta `supabase` registra o backend existente. Ela não deve ser executada automaticamente durante a publicação do frontend.

## Conteúdo

Há 22 presentes, 21 fotos e 20 valores de referência. Os dois valores restantes aparecem como “Consultar valor na loja”; a foto da toalha aparece como “Foto em atualização”. O endereço real aguarda confirmação. Todos os quatro produtos elétricos têm o requisito de 220 V.

## Verificação realizada

- Exportação estática e TypeScript passaram.
- As reservas foram verificadas no Supabase: concorrência, cancelamento autorizado, idempotência e bloqueio de acesso direto à tabela.
- CORS e preflight foram preparados para chamadas do navegador.
- Não houve revisão visual automatizada no navegador nesta entrega.

## Vercel

Acesse https://vercel.com/drop e envie somente a pasta `publicar`. As reservas continuam no Supabase.

## Pix

A seção `app/pix.tsx` permite copiar a chave informada pelo casal para contribuições de qualquer valor. A transferência é feita no aplicativo do banco; não há confirmação automática de pagamentos no site.

## GitHub e Vercel

O código fica na raiz do repositório. Na Vercel, use a raiz como Root Directory, framework Next.js, build `npm run build` e saída `out`. A configuração está em `vercel.json`. As reservas usam a função já publicada no Supabase; não é necessário configurar variáveis secretas para o build.
