# Studio OS

Projeto único, sem monorepo. O que antes era `@codechain/ui` (pacote workspace
separado) foi incorporado como código interno em `src/design-system` — não é
mais uma dependência externa, é parte do próprio Studio OS.

## Rodar localmente

```
npm install
cp .env.example .env.local   # preencher com credenciais reais
npx prisma migrate dev
npm run db:seed
npm run dev
```

## Deploy na Vercel

1. Importar o repositório — raiz do repo é a raiz do projeto, sem configurar
   "Root Directory" nenhum.
2. Framework: Next.js (detectado automaticamente).
3. Environment Variables — copiar de `.env.example`, preencher de verdade:
   - `DATABASE_URL` / `DIRECT_URL` — projeto Supabase real.
   - `AUTH_SECRET` — gerar com `npx auth secret`.
   - `RESEND_API_KEY` / `EMAIL_FROM` — login por magic-link não funciona sem isso.
   - `NEXT_PUBLIC_SUPABASE_URL` / chaves — upload de arquivo não funciona sem isso.
4. Depois do primeiro deploy: rodar `npx prisma migrate deploy` e
   `npm run db:seed` contra o banco real configurado.

## O que ainda depende de você (honesto, não escondido)

- Banco vazio até a migration/seed rodarem contra credenciais reais.
- Primeiro usuário a logar não tem `Membership` em nenhuma organização
  automaticamente — vincule manualmente (ou pelo seed) o primeiro `User` como
  `OWNER` da organização.
- Bug 3 do ADL-103/111 (comissão com taxa de profissional retroativa) é dívida
  técnica registrada, não bloqueia deploy, mas exige nova modelagem de domínio
  para ser corrigida de verdade — ver `docs/ADL.md`.
- Nenhum destes arquivos/comandos foi executado neste ambiente de geração (sem
  acesso de rede) — o código está correto por leitura e por estrutura, não por
  execução confirmada.

## Estrutura

```
src/
  app/                  rotas Next.js (App Router)
  design-system/        primitivos, composites, patterns, workspace (ex-@codechain/ui)
  modules/              domínios (Cliente, Profissional, Serviço, Quote, Appointment, Financeiro)
  lib/                  auth, db, errors, logging, audit
  components/           patterns específicos do Studio OS (não do design system genérico)
prisma/                 schema + seed
docs/                   manifesto, ADLs, modelagens de domínio, relatórios
```
