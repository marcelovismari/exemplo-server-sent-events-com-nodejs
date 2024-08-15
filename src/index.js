const express = require('express');
const fs = require('fs');
const notificacoes = require('./notificacoes');
const path = require('path');

const app = express();
app.use(express.json());

// ******************************************************
// * GET /
// * Entrega o conteúdo do arquivo index.html
// ******************************************************
app.get('/', (_, res) => {
  res.writeHead(200, {
    'content-language': 'text/html',
  });

  const pathIndex = path.join(__dirname, 'index.html');
  const streamIndexHtml = fs.createReadStream(pathIndex);
  streamIndexHtml.pipe(res);
});

// ******************************************************
// * GET /events
// * Através do SSE, entrega mensagens em tempo real
// * ao usuários conectados
// ******************************************************
app.get('/events', (req, res) => {
  res
    .writeHead(200, {
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
    })
    .write('\n');

  // Para fins de teste, o id do usuário é recebido
  // através de uma query string.
  // No mundo real, essa informação poderá ser obtida na
  // sessão da aplicação ou através de um token de acesso
  const idUsuario = req.query.usuario;

  // Cada usuário pode ter várias conexões. Por exemplo,
  // o mesmo usuário pode abrir várias abas, então cada
  // aba será uma conexão vinculada ao usuário.
  // Isto não é uma regra geral, é somente um requisito
  // adotado neste exemplo
  const idConexao = notificacoes.registrarConexao(
    idUsuario,
    res
  );

  // Quando o usuário encerra a conexão, por exemplo,
  // fechando a aba do navegador, o método abaixo é
  // executado
  req.on('close', () => {
    notificacoes.removerConexao(idUsuario, idConexao);
  });
});

// ******************************************************
// * Inicia a escuta das requisições
// ******************************************************
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ouvindo na porta ${PORT}`);
});

// ******************************************************
// * O código abaixo simula a geração de notificações.
// * Em um sistema real, essas notificações seriam
// * enviadas por meio de mensagens de serviços como
// * Kafka, Azure Queue/Service Bus, RabbitMQ, etc.
// ******************************************************
const CINCO_SEGUNDOS_EM_MS = 5_000;

// Envia uma mensagem para todos usuários conectados a
// cada 5 segundos
setInterval(() => {
  notificacoes.enviarMensagemParaTodos(
    `Olá: ${Date.now()}`
  );
}, CINCO_SEGUNDOS_EM_MS);

// Envia uma mensagem para um usuário aleatório a cada 5
// segundos
setInterval(() => {
  const { usuariosConectados } = notificacoes;
  const indiceAleatorio = Math.floor(
    Math.random() * usuariosConectados.length
  );
  const idUsuario = usuariosConectados[indiceAleatorio];

  notificacoes.enviarMensagemClienteEspecifico(
    idUsuario,
    `Mensagem exclusiva do usuário: ${Date.now()}`
  );
}, CINCO_SEGUNDOS_EM_MS);
