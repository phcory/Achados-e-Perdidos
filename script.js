(() => {
  const STORAGE_KEYS = {
    usuarioAtivo: 'usuarioAtivo',
    perfil: 'perfil',
    itensCadastrados: 'itensCadastrados',
    categorias: 'categorias',
    logAuditoria: 'logAuditoria'
  };

  const ADMINS = [
    { user: 'admin', pass: '1234' },
    // { user: 'maria', pass: 'senha123' },
    // { user: 'joao', pass: 'outraSenha' },
  ];

  const CATEGORIAS_PADRAO = [
    'Eletrônicos', 'Documentos', 'Vestuário', 'Acessórios', 'Chaves', 'Outros'
  ];

  const IMAGEM_FALLBACK =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"%3E%3Crect width="300" height="180" fill="%23e2e8f0"/%3E%3Ctext x="150" y="95" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="%2364758b"%3ESem imagem%3C/text%3E%3C/svg%3E';

  const ROTULOS_ARQUIVAMENTO = {
    devolvido: 'Devolvido ao proprietário',
    doado: 'Doado',
    descartado: 'Descartado'
  };

  const state = {
    tipoAtual: 'user',
    itemEmAcao: null // id do item sendo devolvido/arquivado no modal aberto
  };

  const refs = {};

  function initRefs() {
    refs.screenLogin = document.getElementById('screenLogin');
    refs.screenMural = document.getElementById('screenMural');
    refs.screenAdmin = document.getElementById('screenAdmin');
    refs.btnTipoUser = document.getElementById('btnTipoUser');
    refs.btnTipoAdmin = document.getElementById('btnTipoAdmin');
    refs.formUser = document.getElementById('formUser');
    refs.formAdmin = document.getElementById('formAdmin');
    refs.subtitulo = document.getElementById('subtitulo');
    refs.userEmail = document.getElementById('userEmail');
    refs.userSenha = document.getElementById('userSenha');
    refs.adminUser = document.getElementById('adminUser');
    refs.adminSenha = document.getElementById('adminSenha');
    refs.userNameDisplay = document.getElementById('userNameDisplay');
    refs.searchInput = document.getElementById('searchInput');
    refs.muralGrid = document.getElementById('muralGrid');
    refs.navAdminLink = document.getElementById('navAdminLink');
    refs.itemForm = document.getElementById('itemForm');
    refs.adminTableBody = document.getElementById('adminTableBody');
    refs.appMessage = document.getElementById('appMessage');
    refs.imagem = document.getElementById('imagem');

    // RF03 - filtro por categoria no mural
    refs.categoriaFiltro = document.getElementById('categoriaFiltro');

    // RF09 - local de armazenamento
    refs.localArmazenamento = document.getElementById('localArmazenamento');

    // RF11 - gestão de categorias
    refs.categoriaSelectCadastro = document.getElementById('categoria');
    refs.formCategoria = document.getElementById('formCategoria');
    refs.novaCategoriaInput = document.getElementById('novaCategoria');
    refs.categoriasLista = document.getElementById('categoriasLista');

    // RF16 - itens arquivados
    refs.arquivadosTableBody = document.getElementById('arquivadosTableBody');

    // RF13 - log de auditoria
    refs.logTableBody = document.getElementById('logTableBody');

    // RF15 - relatórios
    refs.relatorioResumo = document.getElementById('relatorioResumo');
    refs.btnBaixarCSV = document.getElementById('btnBaixarCSV');
    refs.btnBaixarPDF = document.getElementById('btnBaixarPDF');

    // RF12 - modal de devolução
    refs.modalDevolucao = document.getElementById('modalDevolucao');
    refs.formDevolucao = document.getElementById('formDevolucao');
    refs.devItemTitulo = document.getElementById('devItemTitulo');
    refs.devNome = document.getElementById('devNome');
    refs.devDocumento = document.getElementById('devDocumento');
    refs.devTelefone = document.getElementById('devTelefone');
    refs.btnFecharDevolucao = document.getElementById('btnFecharDevolucao');
    refs.btnCancelarDevolucao = document.getElementById('btnCancelarDevolucao');

    // RF16 - modal de arquivamento
    refs.modalArquivar = document.getElementById('modalArquivar');
    refs.arqItemTitulo = document.getElementById('arqItemTitulo');
    refs.btnFecharArquivar = document.getElementById('btnFecharArquivar');
    refs.btnCancelarArquivar = document.getElementById('btnCancelarArquivar');
    refs.btnConfirmarDoado = document.getElementById('btnConfirmarDoado');
    refs.btnConfirmarDescartado = document.getElementById('btnConfirmarDescartado');
  }

  function mostrarMensagem(texto, tipo = 'info') {
    if (!refs.appMessage) return;

    refs.appMessage.textContent = texto;
    refs.appMessage.className = `app-message ${tipo} visible`;

    window.clearTimeout(mostrarMensagem.timeoutId);
    mostrarMensagem.timeoutId = window.setTimeout(() => {
      refs.appMessage.className = 'app-message';
      refs.appMessage.textContent = '';
    }, 2200);
  }

  function mostrarTela(id) {
    document.querySelectorAll('.screen').forEach((screen) => {
      screen.classList.toggle('active', screen.id === id);
    });
  }

  function configurarImagem(img) {
    img.onerror = () => {
      img.onerror = null;
      img.src = IMAGEM_FALLBACK;
    };

    if (img.complete && img.naturalWidth === 0) {
      img.onerror();
    }
  }

  function formatarDataHora(isoString) {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString('pt-BR');
    } catch (erro) {
      return isoString;
    }
  }

  /* =========================================================
     RF13 - LOG DE AUDITORIA
     Toda alteração relevante em um item (cadastro, mudança de
     status, devolução, arquivamento) gera um registro com
     data/hora, autor (usuário logado) e detalhe da ação.
     ========================================================= */

  function obterLogs() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.logAuditoria)) || [];
  }

  function registrarLog(acao, detalhe, item) {
    const logs = obterLogs();

    logs.unshift({
      data: new Date().toISOString(),
      autor: localStorage.getItem(STORAGE_KEYS.usuarioAtivo) || 'Sistema',
      acao,
      itemTitulo: item ? item.titulo : '-',
      itemId: item ? item.id : null,
      detalhe
    });

    // Mantém só os 200 registros mais recentes para não estourar o localStorage
    localStorage.setItem(STORAGE_KEYS.logAuditoria, JSON.stringify(logs.slice(0, 200)));

    renderizarLogAuditoria();
  }

  function renderizarLogAuditoria() {
    if (!refs.logTableBody) return;

    const logs = obterLogs();
    refs.logTableBody.innerHTML = '';

    if (logs.length === 0) {
      refs.logTableBody.innerHTML =
        '<tr><td colspan="5" class="empty-state">Nenhuma ação registrada ainda.</td></tr>';
      return;
    }

    logs.forEach((log) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatarDataHora(log.data)}</td>
        <td>${log.autor}</td>
        <td>${log.acao}</td>
        <td>${log.itemTitulo}</td>
        <td>${log.detalhe}</td>
      `;
      refs.logTableBody.appendChild(tr);
    });
  }

  /* =========================================================
     RF11 - GESTÃO DE CATEGORIAS
     ========================================================= */

  function obterCategorias() {
    let categorias = JSON.parse(localStorage.getItem(STORAGE_KEYS.categorias));

    if (!categorias || categorias.length === 0) {
      categorias = [...CATEGORIAS_PADRAO];
      localStorage.setItem(STORAGE_KEYS.categorias, JSON.stringify(categorias));
    }

    return categorias;
  }

  function salvarCategorias(lista) {
    localStorage.setItem(STORAGE_KEYS.categorias, JSON.stringify(lista));
  }

  function popularSelectsCategoria() {
    const categorias = obterCategorias();

    if (refs.categoriaSelectCadastro) {
      const valorAtual = refs.categoriaSelectCadastro.value;
      refs.categoriaSelectCadastro.innerHTML = categorias
        .map((c) => `<option value="${c}">${c}</option>`)
        .join('');
      if (categorias.includes(valorAtual)) {
        refs.categoriaSelectCadastro.value = valorAtual;
      }
    }

    if (refs.categoriaFiltro) {
      const valorAtual = refs.categoriaFiltro.value;
      refs.categoriaFiltro.innerHTML =
        '<option value="">Todas as categorias</option>' +
        categorias.map((c) => `<option value="${c}">${c}</option>`).join('');
      if (categorias.includes(valorAtual)) {
        refs.categoriaFiltro.value = valorAtual;
      }
    }
  }

  function renderizarListaCategorias() {
    if (!refs.categoriasLista) return;

    const categorias = obterCategorias();
    refs.categoriasLista.innerHTML = '';

    if (categorias.length === 0) {
      refs.categoriasLista.innerHTML =
        '<li class="empty-state">Nenhuma categoria cadastrada.</li>';
      return;
    }

    categorias.forEach((nome) => {
      const li = document.createElement('li');
      li.className = 'categoria-item';
      li.innerHTML = `
        <span>${nome}</span>
        <span class="categoria-actions">
          <button type="button" class="btn-mini editar" data-categoria="${nome}" title="Editar categoria">Editar</button>
          <button type="button" class="btn-mini remover" data-categoria="${nome}" title="Remover categoria">Remover</button>
        </span>
      `;
      refs.categoriasLista.appendChild(li);
    });

    refs.categoriasLista.querySelectorAll('.btn-mini.editar').forEach((btn) => {
      btn.addEventListener('click', () => editarCategoria(btn.dataset.categoria));
    });

    refs.categoriasLista.querySelectorAll('.btn-mini.remover').forEach((btn) => {
      btn.addEventListener('click', () => removerCategoria(btn.dataset.categoria));
    });
  }

  function adicionarCategoria(event) {
    event.preventDefault();

    const nome = refs.novaCategoriaInput.value.trim();
    if (!nome) return;

    const categorias = obterCategorias();

    const jaExiste = categorias.some((c) => c.toLowerCase() === nome.toLowerCase());
    if (jaExiste) {
      mostrarMensagem('Essa categoria já existe.', 'error');
      return;
    }

    categorias.push(nome);
    salvarCategorias(categorias);

    refs.formCategoria.reset();
    popularSelectsCategoria();
    renderizarListaCategorias();

    registrarLog('Categoria', `Categoria "${nome}" criada.`, null);
    mostrarMensagem('Categoria adicionada!', 'success');
  }

  function editarCategoria(nomeAntigo) {
    const novoNome = prompt('Novo nome para a categoria:', nomeAntigo);
    if (!novoNome || !novoNome.trim() || novoNome.trim() === nomeAntigo) return;

    const nomeLimpo = novoNome.trim();
    const categorias = obterCategorias().map((c) => (c === nomeAntigo ? nomeLimpo : c));
    salvarCategorias(categorias);

    // Atualiza os itens que usavam essa categoria (cascata)
    const itens = obterItensTodos();
    itens.forEach((item) => {
      if (item.categoria === nomeAntigo) item.categoria = nomeLimpo;
    });
    salvarItens(itens);

    popularSelectsCategoria();
    renderizarListaCategorias();
    carregarTabelaAdmin();
    renderizarMural();

    registrarLog('Categoria', `Categoria "${nomeAntigo}" renomeada para "${nomeLimpo}".`, null);
    mostrarMensagem('Categoria atualizada!', 'success');
  }

  function removerCategoria(nome) {
    const confirmar = confirm(
      `Remover a categoria "${nome}"? Os itens cadastrados com ela ficarão sem categoria.`
    );
    if (!confirmar) return;

    const categorias = obterCategorias().filter((c) => c !== nome);
    salvarCategorias(categorias);

    const itens = obterItensTodos();
    itens.forEach((item) => {
      if (item.categoria === nome) item.categoria = '';
    });
    salvarItens(itens);

    popularSelectsCategoria();
    renderizarListaCategorias();
    carregarTabelaAdmin();
    renderizarMural();

    registrarLog('Categoria', `Categoria "${nome}" removida.`, null);
    mostrarMensagem('Categoria removida!', 'success');
  }

  /* =========================================================
     ITENS - leitura e escrita
     ========================================================= */

  function obterItensTodos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.itensCadastrados)) || [];
  }

  function salvarItens(lista) {
    localStorage.setItem(STORAGE_KEYS.itensCadastrados, JSON.stringify(lista));
  }

  // RF16 - itens arquivados (doados/descartados/devolvidos) saem do mural e da lista ativa
  function obterItensAtivos() {
    return obterItensTodos().filter((item) => !item.arquivado);
  }

  function obterItensArquivados() {
    return obterItensTodos().filter((item) => item.arquivado);
  }

  /* =========================================================
     MURAL (visitante)
     ========================================================= */

  function renderizarMural(lista = obterItensAtivos()) {
    refs.muralGrid.innerHTML = '';

    if (lista.length === 0) {
      refs.muralGrid.innerHTML =
        '<p class="empty-state">Nenhum item encontrado.</p>';
      return;
    }

    lista.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      const img = document.createElement('img');
      img.src = item.img;
      img.alt = item.titulo;
      configurarImagem(img);

      const content = document.createElement('div');
      content.className = 'item-content';

      const header = document.createElement('div');
      header.className = 'item-header';

      const badge = document.createElement('span');
      badge.className = `badge ${item.status}`;
      badge.textContent = item.status.toUpperCase();
      header.appendChild(badge);

      if (item.categoria) {
        const catTag = document.createElement('span');
        catTag.className = 'categoria-tag';
        catTag.textContent = item.categoria;
        header.appendChild(catTag);
      }

      const title = document.createElement('div');
      title.className = 'item-title';
      title.textContent = item.titulo;

      const desc = document.createElement('div');
      desc.className = 'item-desc';
      desc.textContent = item.desc;

      const meta = document.createElement('div');
      meta.className = 'item-meta';
      // Observação (RNF03): o local de armazenamento físico (RF09) é
      // informação interna e NÃO é exibido aqui no mural público —
      // só aparece na área administrativa.
      meta.innerHTML = `
        <strong>Local:</strong> ${item.local}<br>
        <strong>Data:</strong> ${item.data}<br>
        <strong>Identificador:</strong> ${item.identificador || 'N/A'}
      `;

      content.append(header, title, desc, meta);

      // RF14 - QR Code
      if (item.identificador) {
        const qrContainer = document.createElement('div');
        qrContainer.style.textAlign = 'center';
        qrContainer.style.marginTop = '15px';

        const qrImagem = document.createElement('img');
        qrImagem.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.identificador)}`;
        qrImagem.alt = `QR Code do item ${item.identificador}`;
        qrImagem.style.width = '150px';
        qrImagem.style.height = '150px';
        qrImagem.style.objectFit = 'contain';

        const qrTexto = document.createElement('div');
        qrTexto.textContent = `Código: ${item.identificador}`;
        qrTexto.style.fontSize = '12px';
        qrTexto.style.marginTop = '5px';
        qrTexto.style.fontWeight = '600';

        qrContainer.append(qrImagem, qrTexto);
        content.appendChild(qrContainer);
      }

      card.append(img, content);
      refs.muralGrid.appendChild(card);
    });
  }

  // RF03 - busca por palavra-chave + filtro por categoria
  function filtrarItens() {
    const termo = refs.searchInput.value.trim().toLowerCase();
    const categoriaSelecionada = refs.categoriaFiltro ? refs.categoriaFiltro.value : '';

    const todos = obterItensAtivos();

    const filtrados = todos.filter((item) => {
      const texto = `${item.titulo} ${item.local} ${item.desc} ${item.identificador || ''} ${item.categoria || ''}`
        .toLowerCase();

      const bateTexto = texto.includes(termo);
      const bateCategoria = !categoriaSelecionada || item.categoria === categoriaSelecionada;

      return bateTexto && bateCategoria;
    });

    renderizarMural(filtrados);
  }

  /* =========================================================
     LOGIN / NAVEGAÇÃO
     ========================================================= */

  function selecionarTipo(tipo) {
    state.tipoAtual = tipo;

    refs.btnTipoUser.classList.toggle('active', tipo === 'user');
    refs.btnTipoAdmin.classList.toggle('active', tipo === 'admin');
    refs.btnTipoAdmin.classList.toggle('admin-mode', tipo === 'admin');
    refs.formUser.style.display = tipo === 'user' ? 'block' : 'none';
    refs.formAdmin.style.display = tipo === 'admin' ? 'block' : 'none';

    refs.subtitulo.textContent =
      tipo === 'user'
        ? 'Acesse o mural de objetos salvos'
        : 'Painel restrito à equipe de gestão';
  }

  function irParaMural() {
    mostrarTela('screenMural');

    const nomeSalvo = localStorage.getItem(STORAGE_KEYS.usuarioAtivo);
    if (nomeSalvo) refs.userNameDisplay.textContent = nomeSalvo;

    const perfil = localStorage.getItem(STORAGE_KEYS.perfil);
    refs.navAdminLink.style.display = perfil === 'admin' ? 'inline' : 'none';

    popularSelectsCategoria();
    renderizarMural(obterItensAtivos());
  }

  function irParaAdmin() {
    if (localStorage.getItem(STORAGE_KEYS.perfil) !== 'admin') {
      mostrarMensagem('Acesso negado! Esta área é exclusiva para administradores.', 'error');
      return;
    }

    mostrarTela('screenAdmin');
    popularSelectsCategoria();
    renderizarListaCategorias();
    carregarTabelaAdmin();
    renderizarArquivados();
    renderizarLogAuditoria();
    renderizarResumoRelatorio();
  }

  function sair() {
    localStorage.removeItem(STORAGE_KEYS.usuarioAtivo);
    localStorage.removeItem(STORAGE_KEYS.perfil);
    mostrarTela('screenLogin');
    mostrarMensagem('Sessão encerrada.', 'success');
  }

  function loginUsuario(event) {
    event.preventDefault();

    const login = refs.userEmail.value.trim();
    if (!login) {
      mostrarMensagem('Informe o e-mail ou matrícula.', 'error');
      return;
    }

    localStorage.setItem(STORAGE_KEYS.usuarioAtivo, login.split('@')[0]);
    localStorage.setItem(STORAGE_KEYS.perfil, 'usuario');

    irParaMural();
    mostrarMensagem('Login realizado com sucesso!', 'success');
  }

  function loginAdmin(event) {
    event.preventDefault();

    const user = refs.adminUser.value.trim();
    const pass = refs.adminSenha.value.trim();

    const encontrado = ADMINS.find((admin) => admin.user === user && admin.pass === pass);

    if (encontrado) {
      localStorage.setItem(STORAGE_KEYS.usuarioAtivo, encontrado.user);
      localStorage.setItem(STORAGE_KEYS.perfil, 'admin');
      irParaAdmin();
      mostrarMensagem('Bem-vindo, administrador!', 'success');
      return;
    }

    mostrarMensagem('Credenciais de administrador incorretas!', 'error');
  }

  /* =========================================================
     CADASTRO DE ITEM (RF05/RF06/RF09/RF11/RF14)
     ========================================================= */

  function converterImagemBase64(arquivo) {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = () => reject(new Error('Erro ao ler imagem.'));
      leitor.readAsDataURL(arquivo);
    });
  }

  function gerarIdentificadorUnico() {
    const timestamp = Date.now();
    const parteAleatoria = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `AEP-${timestamp}-${parteAleatoria}`;
  }

  async function cadastrarItem(event) {
    event.preventDefault();

    const arquivo = refs.imagem.files[0];
    let imagemBase64 = IMAGEM_FALLBACK;

    if (arquivo) {
      try {
        imagemBase64 = await converterImagemBase64(arquivo);
      } catch (erro) {
        mostrarMensagem('Erro ao carregar a imagem.', 'error');
        return;
      }
    }

    const novoItem = {
      id: Date.now(),
      identificador: gerarIdentificadorUnico(), // RF14

      titulo: document.getElementById('titulo').value.trim(),
      status: document.getElementById('status').value,
      categoria: refs.categoriaSelectCadastro ? refs.categoriaSelectCadastro.value : '', // RF11
      local: document.getElementById('local').value.trim(), // onde foi encontrado
      localArmazenamento: refs.localArmazenamento ? refs.localArmazenamento.value.trim() : '', // RF09
      data: document.getElementById('data').value,
      desc: document.getElementById('desc').value.trim(),
      img: imagemBase64,

      // RF16 - controle de arquivamento/descarte
      arquivado: false,
      motivoArquivamento: null,
      dataArquivamento: null,

      // RF12 - termo de devolução (preenchido depois, quando o item for devolvido)
      devolucao: null
    };

    if (!novoItem.titulo || !novoItem.local || !novoItem.data) {
      mostrarMensagem('Preencha título, local e data antes de salvar.', 'error');
      return;
    }

    const cadastrados = obterItensTodos();
    cadastrados.push(novoItem);

    try {
      salvarItens(cadastrados);
    } catch (erro) {
      mostrarMensagem('Não foi possível salvar a imagem. Tente uma imagem menor.', 'error');
      return;
    }

    refs.itemForm.reset();
    carregarTabelaAdmin();
    renderizarMural();
    renderizarResumoRelatorio();

    registrarLog('Cadastro', `Item cadastrado com status "${novoItem.status}".`, novoItem);
    mostrarMensagem(`Item cadastrado! Código: ${novoItem.identificador}`, 'success');
  }

  // RF08 - Alteração de Status
  function alterarStatus(id) {
    const itens = obterItensTodos();
    const item = itens.find((i) => i.id === id);
    if (!item) {
      mostrarMensagem('Item não encontrado.', 'error');
      return;
    }

    const statusAnterior = item.status;
    item.status = item.status === 'achado' ? 'perdido' : 'achado';
    salvarItens(itens);

    carregarTabelaAdmin();
    renderizarMural();

    registrarLog(
      'Alteração de Status',
      `Status alterado de "${statusAnterior}" para "${item.status}".`,
      item
    );
    mostrarMensagem(`Status alterado para ${item.status.toUpperCase()}!`, 'success');
  }

  /* =========================================================
     RF16 - EXCLUSÃO LÓGICA E DESCARTE
     Em vez de apagar o item do sistema, ele é marcado como
     arquivado (Doado ou Descartado) e sai do mural e da lista
     de itens ativos, mas continua existindo no histórico.
     ========================================================= */

  function arquivarItem(id, motivo, detalheExtra = '') {
    const itens = obterItensTodos();
    const item = itens.find((i) => i.id === id);
    if (!item) {
      mostrarMensagem('Item não encontrado.', 'error');
      return;
    }

    item.arquivado = true;
    item.motivoArquivamento = motivo;
    item.dataArquivamento = new Date().toISOString();
    salvarItens(itens);

    carregarTabelaAdmin();
    renderizarArquivados();
    renderizarMural();
    renderizarResumoRelatorio();

    const rotulo = ROTULOS_ARQUIVAMENTO[motivo] || motivo;
    registrarLog('Arquivamento', `Item marcado como "${rotulo}".${detalheExtra}`, item);
    mostrarMensagem(`Item arquivado (${rotulo}).`, 'success');
  }

  function restaurarItem(id) {
    const itens = obterItensTodos();
    const item = itens.find((i) => i.id === id);
    if (!item) return;

    const motivoAnterior = ROTULOS_ARQUIVAMENTO[item.motivoArquivamento] || item.motivoArquivamento;

    item.arquivado = false;
    item.motivoArquivamento = null;
    item.dataArquivamento = null;
    salvarItens(itens);

    carregarTabelaAdmin();
    renderizarArquivados();
    renderizarMural();
    renderizarResumoRelatorio();

    registrarLog('Restauração', `Item restaurado (estava como "${motivoAnterior}").`, item);
    mostrarMensagem('Item restaurado para a lista ativa.', 'success');
  }

  function abrirModalArquivar(id) {
    const item = obterItensTodos().find((i) => i.id === id);
    if (!item) return;

    state.itemEmAcao = id;
    refs.arqItemTitulo.textContent = item.titulo;
    refs.modalArquivar.classList.remove('hidden');
  }

  function fecharModalArquivar() {
    refs.modalArquivar.classList.add('hidden');
    state.itemEmAcao = null;
  }

  /* =========================================================
     RF12 - TERMO DE DEVOLUÇÃO
     Registra os dados do proprietário (nome, documento,
     telefone) no momento da entrega formal do item. Esses
     dados ficam só na área administrativa (RNF03).
     ========================================================= */

  function abrirModalDevolucao(id) {
    const item = obterItensTodos().find((i) => i.id === id);
    if (!item) return;

    state.itemEmAcao = id;
    refs.devItemTitulo.textContent = item.titulo;
    refs.formDevolucao.reset();
    refs.modalDevolucao.classList.remove('hidden');
  }

  function fecharModalDevolucao() {
    refs.modalDevolucao.classList.add('hidden');
    state.itemEmAcao = null;
  }

  function confirmarDevolucao(event) {
    event.preventDefault();

    const nome = refs.devNome.value.trim();
    const documento = refs.devDocumento.value.trim();
    const telefone = refs.devTelefone.value.trim();

    if (!nome || !documento || !telefone) {
      mostrarMensagem('Preencha nome, documento e telefone para registrar a devolução.', 'error');
      return;
    }

    const itens = obterItensTodos();
    const item = itens.find((i) => i.id === state.itemEmAcao);
    if (!item) {
      mostrarMensagem('Item não encontrado.', 'error');
      return;
    }

    item.devolucao = {
      nome,
      documento,
      telefone,
      dataDevolucao: new Date().toISOString()
    };
    item.arquivado = true;
    item.motivoArquivamento = 'devolvido';
    item.dataArquivamento = new Date().toISOString();

    salvarItens(itens);

    // O log NÃO guarda nome/documento/telefone: esses dados sensíveis
    // ficam só dentro do próprio item, restritos à área administrativa.
    registrarLog('Devolução', 'Termo de devolução registrado e item entregue ao proprietário.', item);

    fecharModalDevolucao();
    carregarTabelaAdmin();
    renderizarArquivados();
    renderizarMural();
    renderizarResumoRelatorio();

    mostrarMensagem('Devolução registrada com sucesso!', 'success');
  }

  /* =========================================================
     RF07 / RF09 / RF11 - TABELA DE CONTROLE DE INVENTÁRIO
     ========================================================= */

  function carregarTabelaAdmin() {
    const itensAtivos = obterItensAtivos();
    refs.adminTableBody.innerHTML = '';

    if (itensAtivos.length === 0) {
      refs.adminTableBody.innerHTML =
        '<tr><td colspan="6" class="empty-state">Nenhum item ativo cadastrado.</td></tr>';
      return;
    }

    itensAtivos.forEach((item) => {
      const tr = document.createElement('tr');
      const statusStyle = item.status === 'achado' ? '#10b981' : '#ef4444';

      tr.innerHTML = `
        <td>${item.titulo}</td>
        <td>${item.categoria || 'Sem categoria'}</td>
        <td><strong style="color: ${statusStyle}">${item.status.toUpperCase()}</strong></td>
        <td>${item.local}${item.localArmazenamento ? `<br><small>Guarda: ${item.localArmazenamento}</small>` : ''}</td>
        <td>${item.data}</td>
        <td>
          <button type="button" class="btn-status" data-id="${item.id}" title="Alterar status">Alterar Status</button>
          ${item.status === 'achado'
            ? `<button type="button" class="btn-devolver" data-id="${item.id}" title="Registrar devolução">Devolver</button>`
            : ''
          }
          <button type="button" class="btn-arquivar" data-id="${item.id}" title="Arquivar item">Arquivar</button>
        </td>
      `;

      refs.adminTableBody.appendChild(tr);
    });

    refs.adminTableBody.querySelectorAll('.btn-status').forEach((btn) => {
      btn.addEventListener('click', () => alterarStatus(Number(btn.dataset.id)));
    });

    refs.adminTableBody.querySelectorAll('.btn-devolver').forEach((btn) => {
      btn.addEventListener('click', () => abrirModalDevolucao(Number(btn.dataset.id)));
    });

    refs.adminTableBody.querySelectorAll('.btn-arquivar').forEach((btn) => {
      btn.addEventListener('click', () => abrirModalArquivar(Number(btn.dataset.id)));
    });
  }

  // RF16 - lista de itens arquivados (histórico)
  function renderizarArquivados() {
    if (!refs.arquivadosTableBody) return;

    const arquivados = obterItensArquivados();
    refs.arquivadosTableBody.innerHTML = '';

    if (arquivados.length === 0) {
      refs.arquivadosTableBody.innerHTML =
        '<tr><td colspan="5" class="empty-state">Nenhum item arquivado.</td></tr>';
      return;
    }

    arquivados
      .slice()
      .sort((a, b) => new Date(b.dataArquivamento) - new Date(a.dataArquivamento))
      .forEach((item) => {
        const rotulo = ROTULOS_ARQUIVAMENTO[item.motivoArquivamento] || item.motivoArquivamento;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.titulo}</td>
          <td>${item.categoria || 'Sem categoria'}</td>
          <td>${rotulo}</td>
          <td>${formatarDataHora(item.dataArquivamento)}</td>
          <td>
            <button type="button" class="btn-restaurar" data-id="${item.id}" title="Restaurar item">Restaurar</button>
          </td>
        `;
        refs.arquivadosTableBody.appendChild(tr);
      });

    refs.arquivadosTableBody.querySelectorAll('.btn-restaurar').forEach((btn) => {
      btn.addEventListener('click', () => restaurarItem(Number(btn.dataset.id)));
    });
  }

  /* =========================================================
     RF15 - RELATÓRIOS DE INVENTÁRIO
     ========================================================= */

  function calcularMetricas() {
    const ativos = obterItensAtivos();
    const arquivados = obterItensArquivados();

    return {
      totalAtivos: ativos.length,
      achados: ativos.filter((i) => i.status === 'achado').length,
      perdidos: ativos.filter((i) => i.status === 'perdido').length,
      devolvidos: arquivados.filter((i) => i.motivoArquivamento === 'devolvido').length,
      doados: arquivados.filter((i) => i.motivoArquivamento === 'doado').length,
      descartados: arquivados.filter((i) => i.motivoArquivamento === 'descartado').length,
      totalGeral: ativos.length + arquivados.length
    };
  }

  function renderizarResumoRelatorio() {
    if (!refs.relatorioResumo) return;

    const m = calcularMetricas();

    refs.relatorioResumo.innerHTML = `
      <div class="metrica-item"><strong>${m.totalGeral}</strong><span>Total no acervo</span></div>
      <div class="metrica-item"><strong>${m.achados}</strong><span>Achados (ativos)</span></div>
      <div class="metrica-item"><strong>${m.perdidos}</strong><span>Perdidos (ativos)</span></div>
      <div class="metrica-item"><strong>${m.devolvidos}</strong><span>Devolvidos</span></div>
      <div class="metrica-item"><strong>${m.doados}</strong><span>Doados</span></div>
      <div class="metrica-item"><strong>${m.descartados}</strong><span>Descartados</span></div>
    `;
  }

  function gerarRelatorioCSV() {
    const todos = [...obterItensAtivos(), ...obterItensArquivados()];

    const cabecalho = [
      'Identificador', 'Título', 'Categoria', 'Status', 'Local Encontrado',
      'Local de Armazenamento', 'Data', 'Arquivado', 'Motivo do Arquivamento'
    ];

    const linhas = todos.map((i) => [
      i.identificador || '',
      i.titulo,
      i.categoria || 'Sem categoria',
      i.status,
      i.local,
      i.localArmazenamento || '',
      i.data,
      i.arquivado ? 'Sim' : 'Não',
      i.motivoArquivamento ? (ROTULOS_ARQUIVAMENTO[i.motivoArquivamento] || i.motivoArquivamento) : ''
    ]);

    const escapar = (valor) => `"${String(valor).replace(/"/g, '""')}"`;

    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map(escapar).join(';'))
      .join('\r\n');

    // \uFEFF no início ajuda o Excel a reconhecer acentuação em UTF-8
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-inventario-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    registrarLog('Relatório', 'Relatório de inventário exportado em CSV.', null);
    mostrarMensagem('Relatório CSV baixado com sucesso!', 'success');
  }

  function gerarRelatorioPDF() {
    if (!window.jspdf) {
      mostrarMensagem('Biblioteca de PDF não carregada. Verifique sua conexão.', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const m = calcularMetricas();

    doc.setFontSize(16);
    doc.text('Relatório de Inventário - Achados & Perdidos', 14, 18);

    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 25);

    let y = 36;
    doc.setFontSize(12);
    doc.text('Resumo:', 14, y); y += 7;

    doc.setFontSize(10);
    doc.text(`Itens ativos: ${m.totalAtivos}  (Achados: ${m.achados} / Perdidos: ${m.perdidos})`, 14, y); y += 6;
    doc.text(`Devolvidos: ${m.devolvidos}`, 14, y); y += 6;
    doc.text(`Doados: ${m.doados}`, 14, y); y += 6;
    doc.text(`Descartados: ${m.descartados}`, 14, y); y += 6;
    doc.text(`Total geral no acervo (histórico): ${m.totalGeral}`, 14, y); y += 10;

    doc.setFontSize(12);
    doc.text('Itens:', 14, y); y += 7;
    doc.setFontSize(9);

    const todos = [...obterItensAtivos(), ...obterItensArquivados()];

    todos.forEach((item) => {
      if (y > 280) {
        doc.addPage();
        y = 18;
      }
      const situacao = item.arquivado
        ? `Arquivado (${ROTULOS_ARQUIVAMENTO[item.motivoArquivamento] || item.motivoArquivamento})`
        : item.status;

      const linha = `${item.identificador || '-'} | ${item.titulo} | ${item.categoria || 'Sem categoria'} | ${situacao} | ${item.data || '-'}`;
      doc.text(linha, 14, y);
      y += 5.5;
    });

    doc.save(`relatorio-inventario-${Date.now()}.pdf`);

    registrarLog('Relatório', 'Relatório de inventário exportado em PDF.', null);
    mostrarMensagem('Relatório PDF baixado com sucesso!', 'success');
  }

  /* =========================================================
     EVENTOS
     ========================================================= */

  function bindEvents() {
    document.querySelectorAll('img').forEach(configurarImagem);

    refs.btnTipoUser.addEventListener('click', () => selecionarTipo('user'));
    refs.btnTipoAdmin.addEventListener('click', () => selecionarTipo('admin'));
    refs.formUser.addEventListener('submit', loginUsuario);
    refs.formAdmin.addEventListener('submit', loginAdmin);

    refs.searchInput.addEventListener('input', filtrarItens);
    if (refs.categoriaFiltro) {
      refs.categoriaFiltro.addEventListener('change', filtrarItens);
    }

    refs.itemForm.addEventListener('submit', cadastrarItem);

    if (refs.formCategoria) {
      refs.formCategoria.addEventListener('submit', adicionarCategoria);
    }

    if (refs.formDevolucao) {
      refs.formDevolucao.addEventListener('submit', confirmarDevolucao);
    }
    if (refs.btnFecharDevolucao) refs.btnFecharDevolucao.addEventListener('click', fecharModalDevolucao);
    if (refs.btnCancelarDevolucao) refs.btnCancelarDevolucao.addEventListener('click', fecharModalDevolucao);

    if (refs.btnFecharArquivar) refs.btnFecharArquivar.addEventListener('click', fecharModalArquivar);
    if (refs.btnCancelarArquivar) refs.btnCancelarArquivar.addEventListener('click', fecharModalArquivar);
    if (refs.btnConfirmarDoado) {
      refs.btnConfirmarDoado.addEventListener('click', () => {
        const id = state.itemEmAcao;
        fecharModalArquivar();
        arquivarItem(id, 'doado');
      });
    }
    if (refs.btnConfirmarDescartado) {
      refs.btnConfirmarDescartado.addEventListener('click', () => {
        const id = state.itemEmAcao;
        fecharModalArquivar();
        arquivarItem(id, 'descartado');
      });
    }

    if (refs.btnBaixarCSV) refs.btnBaixarCSV.addEventListener('click', gerarRelatorioCSV);
    if (refs.btnBaixarPDF) refs.btnBaixarPDF.addEventListener('click', gerarRelatorioPDF);

    document.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'logout') sair();
        if (action === 'mural') irParaMural();
        if (action === 'admin') irParaAdmin();
      });
    });
  }

  function inicializarApp() {
    initRefs();
    bindEvents();
    selecionarTipo('user');

    obterCategorias(); // garante que a lista padrão exista
    popularSelectsCategoria();

    const perfil = localStorage.getItem(STORAGE_KEYS.perfil);

    if (perfil === 'admin' || perfil === 'usuario') {
      irParaMural();
      return;
    }

    mostrarTela('screenLogin');
  }

  document.addEventListener('DOMContentLoaded', inicializarApp);
})();
