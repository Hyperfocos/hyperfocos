# HyperFoco — Para o cérebro com TDAH

## Stack
Next.js 16 · TypeScript · Tailwind · Supabase · Asaas · Vercel

---

## Semana 1 — Checklist de deploy

### 1. Supabase
1. Crie projeto em supabase.com (região: South America São Paulo)
2. SQL Editor → cole e rode `supabase/migration.sql`
3. Authentication → Providers → habilite Google
4. Settings → API → copie as 3 chaves para o .env.local

### 2. Variáveis de ambiente (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://hyperfoco.com.br
```

### 3. GitHub
```bash
git init && git add . && git commit -m "feat: semana 1"
gh repo create hyperfoco --private --push --source=.
```

### 4. Vercel
1. vercel.com → New Project → importar repo
2. Adicionar as mesmas variáveis de ambiente
3. Deploy

### 5. Domínio
- Registro.br: registrar hyperfoco.com.br
- Vercel → Settings → Domains → adicionar domínio
- Registro.br → nameservers: ns1.vercel-dns.com e ns2.vercel-dns.com

### Rodar local
```bash
npm install
cp .env.example .env.local  # preencher as chaves
npm run dev
```
