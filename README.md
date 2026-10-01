# Tiro de Guerra — Sistema de Escalas

Sistema simples para gerenciamento de escalas de Atiradores e Monitores de um
Tiro de Guerra. Construído com Next.js (App Router), TypeScript, Tailwind CSS,
Prisma e Server Actions — sem bibliotecas extras.

## Como instalar

```bash
npm install
```

## Como configurar o banco

O projeto usa **SQLite em desenvolvimento** e está preparado para
**PostgreSQL em produção (Vercel)**, ambos através do Prisma.

### Desenvolvimento (SQLite)

Já existe um arquivo `.env` configurado para SQLite local:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="troque-este-valor-em-producao-por-uma-string-aleatoria"
```

Crie o banco e as tabelas:

```bash
npx prisma db push
```

Popule o banco com dados iniciais (1 admin + militares de exemplo):

```bash
npm run seed
```

### Produção (PostgreSQL / Vercel)

1. Abra `prisma/schema.prisma` e troque o provider:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Configure `DATABASE_URL` com a connection string do seu banco Postgres
   (Vercel Postgres, Neon, Supabase, etc.) e um `AUTH_SECRET` forte.
3. Rode `npx prisma db push` apontando para o banco de produção (ou configure
   isso no passo de build da Vercel).

> Como o mesmo schema é usado para SQLite e PostgreSQL, a troca do `provider`
> só precisa ser feita quando for migrar definitivamente para produção.

## Como executar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Login de teste (criado pelo seed):

```
E-mail: admin@tg.local
Senha: 123456
```

## Como fazer o deploy na Vercel

1. Suba o projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Importe o repositório na Vercel.
3. Nas variáveis de ambiente do projeto, defina:
   - `DATABASE_URL` → connection string do PostgreSQL de produção
   - `AUTH_SECRET` → uma string aleatória e secreta
4. Antes do primeiro deploy, troque o `provider` do `prisma/schema.prisma`
   para `"postgresql"` (veja a seção acima) e faça commit.
5. Rode `npx prisma db push` (localmente, apontando para a `DATABASE_URL` de
   produção) para criar as tabelas, e `npm run seed` para criar o usuário
   administrador inicial.
6. Faça o deploy normalmente (`vercel --prod` ou pelo painel da Vercel). O
   script `build` já executa `prisma generate` automaticamente.
