const crypto = require('crypto');

class Notificacoes {
  /**
   * Para cada usuário, guarda as diversas conexões e seu
   * respectivo objeto `response` utilizado para enviar
   * mensagens para o cliente.
   * @type {Map<string, { idConexao: string,
   *                      response: Response }>}
   */
  #conexoesDosUsuarios = new Map();

  /** Retorna o id dos usuários conectados */
  get usuariosConectados() {
    return [...this.#conexoesDosUsuarios.keys()];
  }

  registrarConexao(idUsuario, response) {
    if (!this.#conexoesDosUsuarios.has(idUsuario)) {
      this.#conexoesDosUsuarios.set(idUsuario, []);
    }

    const idConexao = this.#gerarNovoIdDeConexao();
    this.#conexoesDosUsuarios
      .get(idUsuario)
      .push({ idConexao, response });

    return idConexao;
  }

  removerConexao(idUsuario, idConexao) {
    if (!this.#conexoesDosUsuarios.has(idUsuario)) {
      return;
    }

    // Remove a conexão da lista do usuário
    const conexoes = this.#conexoesDosUsuarios
      .get(idUsuario)
      .filter((a) => a.idConexao !== idConexao);

    if (conexoes.length) {
      this.#conexoesDosUsuarios.set(idUsuario, conexoes);
    } else {
      this.#conexoesDosUsuarios.delete(idUsuario);
    }
  }

  enviarMensagemParaTodos(mensagem) {
    for (const idUsuario of this.usuariosConectados) {
      this.enviarMensagemClienteEspecifico(
        idUsuario,
        mensagem
      );
    }
  }

  enviarMensagemClienteEspecifico(idUsuario, mensagem) {
    if (!this.#conexoesDosUsuarios.has(idUsuario)) {
      return;
    }

    const conexoesDoUsuario =
      this.#conexoesDosUsuarios.get(idUsuario);

    for (const conexoes of conexoesDoUsuario) {
      const { response, idConexao } = conexoes;
      this.#enviarMensagem(
        response,
        idUsuario,
        idConexao,
        mensagem
      );
    }
  }

  #enviarMensagem(res, idUsuario, idConexao, mensagem) {
    const objMensagem = JSON.stringify({
      idUsuario,
      idConexao,
      mensagem,
    });

    res.write(`data: ${objMensagem}\n\n`);
  }

  #gerarNovoIdDeConexao() {
    return crypto.randomBytes(20).toString('hex');
  }
}

module.exports = new Notificacoes();
