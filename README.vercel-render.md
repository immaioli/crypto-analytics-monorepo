# Deploy na Vercel + Render (Plano Free)

Devido às restrições para pagamentos no Oracle Cloud, esta é a arquitetura **Split-Stack (PaaS)** alternativa, utilizando serviços em nuvem gerenciados que não cobram pelo cadastro inicial.

Nesta configuração, dividimos as responsabilidades onde cada plataforma brilha.

## 1. Frontend (Next.js) na Vercel
A Vercel é a criadora do Next.js e possui a melhor integração global (CDN) e escalabilidade nativa.

1. Faça o login na [Vercel](https://vercel.com/) vinculando seu GitHub.
2. Adicione um novo projeto apontando para o seu repositório `crypto-analytics-monorepo`.
3. Na configuração do Build (Vercel reconhecerá o monorepo):
   * **Root Directory:** `apps/web`
   * **Framework Preset:** Next.js
4. **Environment Variables:**
   * Crie uma variável: `NEXT_PUBLIC_API_URL`
   * Valor: A URL final da sua API no Render (Ex: `https://api-dashboard-cripto.onrender.com`)
5. Clique em Deploy.

## 2. Banco de Dados / Cache (Redis) no Upstash
Bancos de dados perdem estado durante os deploys ou quando o servidor "dorme". Usaremos a nuvem Serverless do Upstash para o Redis.

1. Cadastre-se no [Upstash](https://upstash.com/).
2. Crie uma Database Redis (Global).
3. Role até a seção "Node" / "ioredis" e copie sua Connection URL (ela começará com `rediss://` indicando conexão TLS segura). 
4. Guarde essa URL para o passo a seguir.

## 3. Backend (NestJS API) no Render
A API não pode rodar na Vercel (arquitetura Serverless) porque temos WebSockets e rotinas Cron que exigem um servidor constantemente ligado. O Render nos fornece esse "Web Service".

1. Cadastre-se no [Render.com](https://render.com/) e crie um **New Web Service**.
2. Conecte seu repositório GitHub.
3. Configure:
   * **Root Directory:** `apps/api`
   * **Environment:** `Node`
   * **Build Command:** `npm ci --include-workspace-root && npm run build`
   * **Start Command:** `npm run start:prod`
4. **Environment Variables:**
   * `NODE_ENV`: `production`
   * `CORS_ORIGIN`: `https://sua-url-gerada-na.vercel.app` (Isso impede que sites de terceiros suguem seus recursos/apis gratuitamente).
   * `REDIS_URL`: `rediss://...` (Cole a URL copiada do Upstash aqui).
5. Selecione o plano **Free** e faça o deploy.

## 4. Evitando que a API "Durma" (GitHub Actions)
O tier gratuito da Render suspende sua aplicação após 15 minutos sem receber tráfego. 
Para mitigar isso de forma gratuita e transparente, criamos uma rotina no próprio repositório!

1. Na raiz do seu código, edite o arquivo `.github/workflows/keep-alive.yml`.
2. O arquivo já está configurado para a URL `https://crypto-analytics-monorepo.onrender.com`.
3. Faça commit da alteração para o GitHub. 

Pronto! A cada 10 minutos, o GitHub pingará silenciosamente a sua rota leve `/health`, garantindo que a Render não suspenda a máquina e que seus `WebSockets` continuem funcionando perfeitamente em tempo real.