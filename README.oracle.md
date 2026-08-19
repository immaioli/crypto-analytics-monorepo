# Deploy na Oracle Cloud (Always Free Tier)

A Oracle Cloud fornece instâncias **VM.Standard.A1.Flex (Arquitetura ARM64 / Ampere)** gratuitas com até 24GB de RAM. Como o nosso monorepo possui containers docker (Next.js Standalone + NestJS + Redis + Nginx), esta é a plataforma gratuita ideal para manter as conexões `WebSocket` sempre vivas e os `@Cron` jobs rodando perfeitamente sem o problema de instâncias pausadas (Sleep), o qual é comum em serviços PaaS como Render, Vercel ou Heroku.

## 1. Preparação da VM no Painel da Oracle (OCI Console)
1. Crie uma nova instância "Compute".
2. **Image:** Ubuntu 22.04 LTS (ou superior).
3. **Shape:** VM.Standard.A1.Flex (Ampere ARM). Alocar de 1 a 4 OCPUs e 6 a 24GB de RAM.
4. Salve sua chave `.key` / `.pub` de SSH para conseguir acesso ao servidor.

## 2. Liberação de Portas (Firewall / Ingress Rules)
No painel da Oracle:
1. Vá em VCN -> Subnets -> Security Lists.
2. Adicione **Ingress Rules** liberando as portas TCP `80` (HTTP) e `443` (HTTPS) para a Source `0.0.0.0/0`.

No Servidor Ubuntu via SSH (`ssh ubuntu@IP_PUBLICO -i sua_chave.key`):
O Ubuntu na Oracle tem um iptables customizado super rígido nativamente, mesmo que você abra na VCN da nuvem. Você **precisa** liberar pelo iptables interno:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 3. Instalação do Docker e Docker Compose
Sendo uma máquina ARM limpa, rode o script oficial de instalação do Docker:

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Dar permissões ao seu usuário para rodar docker sem sudo
sudo usermod -aG docker ubuntu

# Ative o grupo sem precisar fazer logout
newgrp docker
```

## 4. Clonar e Inicializar a Aplicação

```bash
# Baixe os arquivos do seu repositório
git clone https://github.com/SEU_USUARIO/crypto-analytics-monorepo.git
cd crypto-analytics-monorepo

# Subir todos os serviços (Web, Api, Redis e Nginx) silenciosamente
docker compose up -d --build
```

**Por que o `--build`?** 
Nós utilizamos `node:20-alpine` de forma multi-stage (vários estágios de construção para reduzir a imagem final). A compilação é cross-platform e funcionará de forma otimizada para os processadores Ampere A1 (ARM64) graças à detecção automática de arquitetura do Docker.

## 5. Manutenção e Monitoramento

*   **Para ver os logs (inclusive eventuais erros do Cron):**
    ```bash
    docker compose logs -f
    ```
*   **Para recarregar o Nginx após uma alteração no arquivo `nginx.conf`:**
    ```bash
    docker exec crypto_nginx nginx -s reload
    ```
*   **Para parar o sistema:**
    ```bash
    docker compose down
    ```

## 6. (Opcional, porém Fortemente Recomendado) Let's Encrypt SSL
Para habilitar o cadeado verde no seu domínio real, o ideal é instalar o `certbot` diretamente no seu Ubuntu e pedir ao Nginx para referenciá-lo, ou configurar uma imagem docker adicional (como Traefik/Certbot) no compose.
