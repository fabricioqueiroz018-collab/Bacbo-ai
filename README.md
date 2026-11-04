# BAC BO AI — starter para iPhone

Este é um protótipo PWA com painel, histórico, stream SSE e banca fictícia. Ele **não prevê resultados** e não realiza apostas.

## Requisitos
- Node.js 18+
- Conta LynxMetrics e chave da API Bac Bo Live
- Hospedagem HTTPS para abrir como app no iPhone

## Configuração segura
1. No painel LynxMetrics, confirme seu e-mail e ative o teste Bac Bo Live.
2. Copie a chave `sk-lynx...`.
3. No servidor de hospedagem, configure a variável de ambiente `LYNX_API_KEY` com essa chave.
4. Inicie com `npm start` (ou `node server.js`).
5. Não coloque a chave no JavaScript do navegador e não a envie em mensagens.

A chave fica somente no servidor. O app acessa `/api/stream`, `/api/results` e `/api/latest` no próprio domínio.

## Instalar no iPhone
Depois de publicar em HTTPS: abra o endereço no Safari → Compartilhar → Adicionar à Tela de Início.

## Importante
A LynxMetrics documenta `GET /v1/bacbo-live/stream` (SSE), `/results`, `/latest` e `/stats`. O stream deve ser testado no plano/conta contratados. Este starter não contém chave, hospedagem, notificações push nativas ou integração com apostas.
