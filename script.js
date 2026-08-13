(() => {
  const STORAGE_KEYS = {
    usuarioAtivo: 'usuarioAtivo',
    perfil: 'perfil',
    itensCadastrados: 'itensCadastrados'
  };

  const ADMINS = [
    { user: 'admin', pass: '1234' },
    // { user: 'maria', pass: 'senha123' },
    // { user: 'joao', pass: 'outraSenha' },
  ];

  const itensIniciais = [
    {
      id: 1,
      titulo: 'Chaveiro de Carro',
      status: 'achado',
      local: 'Estacionamento Bloco B',
      data: '10/08/2026',
      img: 'https://via.placeholder.com/300x180?text=Chaveiro',
      desc: 'Chaveiro de couro preto com 3 chaves.'
    },
    {
      id: 2,
      titulo: 'Mochila Azul',
      status: 'perdido',
      local: 'Biblioteca - 2º Andar',
      data: '11/08/2026',
      img: 'https://via.placeholder.com/300x180?text=Mochila',
      desc: 'Mochila com cadernos e um estojo.'
    },
    {
      id: 3,
      titulo: 'Garrafa Térmica',
      status: 'achado',
      local: 'Praça de Alimentação',
      data: '12/08/2026',
      img: 'https://via.placeholder.com/300x180?text=Garrafa',
      desc: 'Garrafa térmica metálica cor prata.'
    }
  ];

  const state = {
    tipoAtual: 'user'
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

  function obterItens() {
    const cadastrados = JSON.parse(localStorage.getItem(STORAGE_KEYS.itensCadastrados)) || [];
    return [...itensIniciais, ...cadastrados];
  }

  function renderizarMural(lista = obterItens()) {
    refs.muralGrid.innerHTML = '';

    if (lista.length === 0) {
      refs.muralGrid.innerHTML = '<p class="empty-state">Nenhum item encontrado.</p>';
      return;
    }

    lista.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      const img = document.createElement('img');
      img.src = item.img;
      img.alt = item.titulo;
      img.onerror = () => {
        img.src = 'https://via.placeholder.com/300x180?text=Sem+Imagem';
      };

      const content = document.createElement('div');
      content.className = 'item-content';

      const header = document.createElement('div');
      header.className = 'item-header';
      const badge = document.createElement('span');
      badge.className = `badge ${item.status}`;
      badge.textContent = item.status.toUpperCase();
      header.appendChild(badge);

      const title = document.createElement('div');
      title.className = 'item-title';
      title.textContent = item.titulo;

      const desc = document.createElement('div');
      desc.className = 'item-desc';
      desc.textContent = item.desc;

      const meta = document.createElement('div');
      meta.className = 'item-meta';
      meta.innerHTML = `<strong>Local:</strong> ${item.local}<br><strong>Data:</strong> ${item.data}`;

      content.append(header, title, desc, meta);
      card.append(img, content);
      refs.muralGrid.appendChild(card);
    });
  }

  function filtrarItens() {
    const termo = refs.searchInput.value.trim().toLowerCase();
    const todos = obterItens();
    const filtrados = todos.filter((item) => {
      const texto = `${item.titulo} ${item.local} ${item.desc}`.toLowerCase();
      return texto.includes(termo);
    });

    renderizarMural(filtrados);
  }

  function selecionarTipo(tipo) {
    state.tipoAtual = tipo;

    refs.btnTipoUser.classList.toggle('active', tipo === 'user');
    refs.btnTipoAdmin.classList.toggle('active', tipo === 'admin');
    refs.btnTipoAdmin.classList.toggle('admin-mode', tipo === 'admin');

    refs.formUser.style.display = tipo === 'user' ? 'block' : 'none';
    refs.formAdmin.style.display = tipo === 'admin' ? 'block' : 'none';

    refs.subtitulo.textContent = tipo === 'user'
      ? 'Acesse o mural de objetos salvos'
      : 'Painel restrito à equipe de gestão';
  }

  function irParaMural() {
    mostrarTela('screenMural');

    const nomeSalvo = localStorage.getItem(STORAGE_KEYS.usuarioAtivo);
    if (nomeSalvo) refs.userNameDisplay.textContent = nomeSalvo;

    const perfil = localStorage.getItem(STORAGE_KEYS.perfil);
    refs.navAdminLink.style.display = perfil === 'admin' ? 'inline' : 'none';
    renderizarMural(obterItens());
  }

  function irParaAdmin() {
    if (localStorage.getItem(STORAGE_KEYS.perfil) !== 'admin') {
      mostrarMensagem('Acesso negado! Esta área é exclusiva para administradores.', 'error');
      return;
    }

    mostrarTela('screenAdmin');
    carregarTabelaAdmin();
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

  function cadastrarItem(event) {
    event.preventDefault();

    const novoItem = {
      id: Date.now(),
      titulo: document.getElementById('titulo').value.trim(),
      status: document.getElementById('status').value,
      local: document.getElementById('local').value.trim(),
      data: document.getElementById('data').value,
      desc: document.getElementById('desc').value.trim(),
      img: 'https://via.placeholder.com/300x180?text=Item'
    };

    if (!novoItem.titulo || !novoItem.local || !novoItem.data) {
      mostrarMensagem('Preencha título, local e data antes de salvar.', 'error');
      return;
    }

    const cadastrados = JSON.parse(localStorage.getItem(STORAGE_KEYS.itensCadastrados)) || [];
    cadastrados.push(novoItem);
    localStorage.setItem(STORAGE_KEYS.itensCadastrados, JSON.stringify(cadastrados));

    refs.itemForm.reset();
    carregarTabelaAdmin();
    renderizarMural();
    mostrarMensagem('Item cadastrado com sucesso!', 'success');
  }

  function removerItem(id) {
    let cadastrados = JSON.parse(localStorage.getItem(STORAGE_KEYS.itensCadastrados)) || [];
    cadastrados = cadastrados.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.itensCadastrados, JSON.stringify(cadastrados));
    carregarTabelaAdmin();
    renderizarMural();
    mostrarMensagem('Item removido com sucesso!', 'success');
  }

  function carregarTabelaAdmin() {
    const cadastrados = JSON.parse(localStorage.getItem(STORAGE_KEYS.itensCadastrados)) || [];
    refs.adminTableBody.innerHTML = '';

    if (cadastrados.length === 0) {
      refs.adminTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum item cadastrado manualmente.</td></tr>';
      return;
    }

    cadastrados.forEach((item) => {
      const tr = document.createElement('tr');
      const statusStyle = item.status === 'achado' ? '#10b981' : '#ef4444';

      tr.innerHTML = `
        <td>${item.titulo}</td>
        <td><strong style="color: ${statusStyle}">${item.status.toUpperCase()}</strong></td>
        <td>${item.data}</td>
        <td><button type="button" class="btn-delete" data-id="${item.id}">Excluir</button></td>
      `;

      refs.adminTableBody.appendChild(tr);
    });

    refs.adminTableBody.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => removerItem(Number(btn.dataset.id)));
    });
  }

  function bindEvents() {
    refs.btnTipoUser.addEventListener('click', () => selecionarTipo('user'));
    refs.btnTipoAdmin.addEventListener('click', () => selecionarTipo('admin'));
    refs.formUser.addEventListener('submit', loginUsuario);
    refs.formAdmin.addEventListener('submit', loginAdmin);
    refs.searchInput.addEventListener('input', filtrarItens);
    refs.itemForm.addEventListener('submit', cadastrarItem);

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

    const perfil = localStorage.getItem(STORAGE_KEYS.perfil);
    if (perfil === 'admin' || perfil === 'usuario') {
      irParaMural();
      return;
    }

    mostrarTela('screenLogin');
  }

  document.addEventListener('DOMContentLoaded', inicializarApp);
})();
