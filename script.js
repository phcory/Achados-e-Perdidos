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

  const itensIniciais = [];

  const IMAGEM_FALLBACK =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"%3E%3Crect width="300" height="180" fill="%23e2e8f0"/%3E%3Ctext x="150" y="95" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="%2364758b"%3ESem imagem%3C/text%3E%3C/svg%3E';

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

    // Campo de imagem
    refs.imagem = document.getElementById('imagem');
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

  function obterItens() {
    const cadastrados =
      JSON.parse(
        localStorage.getItem(STORAGE_KEYS.itensCadastrados)
      ) || [];

    return [...itensIniciais, ...cadastrados];
  }

  function renderizarMural(lista = obterItens()) {
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

      const title = document.createElement('div');
      title.className = 'item-title';
      title.textContent = item.titulo;

      const desc = document.createElement('div');
      desc.className = 'item-desc';
      desc.textContent = item.desc;

      const meta = document.createElement('div');
      meta.className = 'item-meta';

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

        qrImagem.src =
          `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.identificador)}`;

        qrImagem.alt =
          `QR Code do item ${item.identificador}`;

        qrImagem.style.width = '150px';
        qrImagem.style.height = '150px';
        qrImagem.style.objectFit = 'contain';

        const qrTexto = document.createElement('div');

        qrTexto.textContent =
          `Código: ${item.identificador}`;

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

  function filtrarItens() {
    const termo =
      refs.searchInput.value.trim().toLowerCase();

    const todos = obterItens();

    const filtrados = todos.filter((item) => {
      const texto =
        `${item.titulo} ${item.local} ${item.desc} ${item.identificador || ''}`
          .toLowerCase();

      return texto.includes(termo);
    });

    renderizarMural(filtrados);
  }

  function selecionarTipo(tipo) {
    state.tipoAtual = tipo;

    refs.btnTipoUser.classList.toggle(
      'active',
      tipo === 'user'
    );

    refs.btnTipoAdmin.classList.toggle(
      'active',
      tipo === 'admin'
    );

    refs.btnTipoAdmin.classList.toggle(
      'admin-mode',
      tipo === 'admin'
    );

    refs.formUser.style.display =
      tipo === 'user' ? 'block' : 'none';

    refs.formAdmin.style.display =
      tipo === 'admin' ? 'block' : 'none';

    refs.subtitulo.textContent =
      tipo === 'user'
        ? 'Acesse o mural de objetos salvos'
        : 'Painel restrito à equipe de gestão';
  }

  function irParaMural() {
    mostrarTela('screenMural');

    const nomeSalvo =
      localStorage.getItem(
        STORAGE_KEYS.usuarioAtivo
      );

    if (nomeSalvo) {
      refs.userNameDisplay.textContent =
        nomeSalvo;
    }

    const perfil =
      localStorage.getItem(
        STORAGE_KEYS.perfil
      );

    refs.navAdminLink.style.display =
      perfil === 'admin' ? 'inline' : 'none';

    renderizarMural(obterItens());
  }

  function irParaAdmin() {
    if (
      localStorage.getItem(STORAGE_KEYS.perfil) !==
      'admin'
    ) {
      mostrarMensagem(
        'Acesso negado! Esta área é exclusiva para administradores.',
        'error'
      );

      return;
    }

    mostrarTela('screenAdmin');
    carregarTabelaAdmin();
  }

  function sair() {
    localStorage.removeItem(
      STORAGE_KEYS.usuarioAtivo
    );

    localStorage.removeItem(
      STORAGE_KEYS.perfil
    );

    mostrarTela('screenLogin');

    mostrarMensagem(
      'Sessão encerrada.',
      'success'
    );
  }

  function loginUsuario(event) {
    event.preventDefault();

    const login =
      refs.userEmail.value.trim();

    if (!login) {
      mostrarMensagem(
        'Informe o e-mail ou matrícula.',
        'error'
      );

      return;
    }

    localStorage.setItem(
      STORAGE_KEYS.usuarioAtivo,
      login.split('@')[0]
    );

    localStorage.setItem(
      STORAGE_KEYS.perfil,
      'usuario'
    );

    irParaMural();

    mostrarMensagem(
      'Login realizado com sucesso!',
      'success'
    );
  }

  function loginAdmin(event) {
    event.preventDefault();

    const user =
      refs.adminUser.value.trim();

    const pass =
      refs.adminSenha.value.trim();

    const encontrado =
      ADMINS.find(
        (admin) =>
          admin.user === user &&
          admin.pass === pass
      );

    if (encontrado) {
      localStorage.setItem(
        STORAGE_KEYS.usuarioAtivo,
        encontrado.user
      );

      localStorage.setItem(
        STORAGE_KEYS.perfil,
        'admin'
      );

      irParaAdmin();

      mostrarMensagem(
        'Bem-vindo, administrador!',
        'success'
      );

      return;
    }

    mostrarMensagem(
      'Credenciais de administrador incorretas!',
      'error'
    );
  }

  // Converte a imagem selecionada para Base64
  function converterImagemBase64(arquivo) {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();

      leitor.onload = () => {
        resolve(leitor.result);
      };

      leitor.onerror = () => {
        reject(
          new Error('Erro ao ler imagem.')
        );
      };

      leitor.readAsDataURL(arquivo);
    });
  }

  // RF14 - Geração de Identificador Único
  function gerarIdentificadorUnico() {
    const timestamp = Date.now();

    const parteAleatoria =
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    return `AEP-${timestamp}-${parteAleatoria}`;
  }

  async function cadastrarItem(event) {
    event.preventDefault();

    const arquivo =
      refs.imagem.files[0];

    let imagemBase64 = IMAGEM_FALLBACK;

    if (arquivo) {
      try {
        imagemBase64 =
          await converterImagemBase64(
            arquivo
          );
      } catch (erro) {
        mostrarMensagem(
          'Erro ao carregar a imagem.',
          'error'
        );

        return;
      }
    }

    const novoItem = {
      id: Date.now(),

      // RF14
      identificador:
        gerarIdentificadorUnico(),

      titulo:
        document
          .getElementById('titulo')
          .value
          .trim(),

      status:
        document
          .getElementById('status')
          .value,

      local:
        document
          .getElementById('local')
          .value
          .trim(),

      data:
        document
          .getElementById('data')
          .value,

      desc:
        document
          .getElementById('desc')
          .value
          .trim(),

      img: imagemBase64
    };

    if (
      !novoItem.titulo ||
      !novoItem.local ||
      !novoItem.data
    ) {
      mostrarMensagem(
        'Preencha título, local e data antes de salvar.',
        'error'
      );

      return;
    }

    const cadastrados =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEYS.itensCadastrados
        )
      ) || [];

    cadastrados.push(novoItem);

    try {
      localStorage.setItem(
        STORAGE_KEYS.itensCadastrados,
        JSON.stringify(cadastrados)
      );
    } catch (erro) {
      mostrarMensagem(
        'Não foi possível salvar a imagem. Tente uma imagem menor.',
        'error'
      );

      return;
    }

    refs.itemForm.reset();

    carregarTabelaAdmin();
    renderizarMural();

    mostrarMensagem(
      `Item cadastrado! Código: ${novoItem.identificador}`,
      'success'
    );
  }

  function removerItem(id) {
    let cadastrados =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEYS.itensCadastrados
        )
      ) || [];

    cadastrados =
      cadastrados.filter(
        (item) => item.id !== id
      );

    localStorage.setItem(
      STORAGE_KEYS.itensCadastrados,
      JSON.stringify(cadastrados)
    );

    carregarTabelaAdmin();
    renderizarMural();

    mostrarMensagem(
      'Item removido com sucesso!',
      'success'
    );
  }

  // RF08 - Alteração de Status
  function alterarStatus(id) {
    let cadastrados =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEYS.itensCadastrados
        )
      ) || [];

    const itemCadastrado =
      cadastrados.find(
        (item) => item.id === id
      );

    if (itemCadastrado) {
      itemCadastrado.status =
        itemCadastrado.status === 'achado'
          ? 'perdido'
          : 'achado';

      localStorage.setItem(
        STORAGE_KEYS.itensCadastrados,
        JSON.stringify(cadastrados)
      );

      carregarTabelaAdmin();
      renderizarMural();

      mostrarMensagem(
        `Status alterado para ${itemCadastrado.status.toUpperCase()}!`,
        'success'
      );

      return;
    }

    const itemInicial =
      itensIniciais.find(
        (item) => item.id === id
      );

    if (!itemInicial) {
      mostrarMensagem(
        'Item não encontrado.',
        'error'
      );

      return;
    }

    const novoStatus =
      itemInicial.status === 'achado'
        ? 'perdido'
        : 'achado';

    cadastrados.push({
      ...itemInicial,
      status: novoStatus
    });

    localStorage.setItem(
      STORAGE_KEYS.itensCadastrados,
      JSON.stringify(cadastrados)
    );

    carregarTabelaAdmin();
    renderizarMural();

    mostrarMensagem(
      `Status alterado para ${novoStatus.toUpperCase()}!`,
      'success'
    );
  }

  // RF07 - Tabela de Controle de Inventário
  function carregarTabelaAdmin() {
    const todosItens =
      obterItens();

    refs.adminTableBody.innerHTML =
      '';

    if (todosItens.length === 0) {
      refs.adminTableBody.innerHTML =
        '<tr><td colspan="5" class="empty-state">Nenhum item cadastrado.</td></tr>';

      return;
    }

    todosItens.forEach((item) => {
      const tr =
        document.createElement('tr');

      const statusStyle =
        item.status === 'achado'
          ? '#10b981'
          : '#ef4444';

      const podeExcluir =
        item.id > 3;

      tr.innerHTML = `
        <td>${item.titulo}</td>

        <td>
          <strong style="color: ${statusStyle}">
            ${item.status.toUpperCase()}
          </strong>
        </td>

        <td>${item.local}</td>

        <td>${item.data}</td>

        <td>
          <button
            type="button"
            class="btn-status"
            data-id="${item.id}"
            title="Alterar status"
          >
            Alterar Status
          </button>

          ${
            podeExcluir
              ? `
                <button
                  type="button"
                  class="btn-delete"
                  data-id="${item.id}"
                  title="Excluir item"
                >
                  Excluir
                </button>
              `
              : ''
          }
        </td>
      `;

      refs.adminTableBody.appendChild(
        tr
      );
    });

    refs.adminTableBody
      .querySelectorAll('.btn-status')
      .forEach((btn) => {
        btn.addEventListener(
          'click',
          () => {
            alterarStatus(
              Number(
                btn.dataset.id
              )
            );
          }
        );
      });

    refs.adminTableBody
      .querySelectorAll('.btn-delete')
      .forEach((btn) => {
        btn.addEventListener(
          'click',
          () => {
            removerItem(
              Number(
                btn.dataset.id
              )
            );
          }
        );
      });
  }

  function bindEvents() {
    document.querySelectorAll('img').forEach(configurarImagem);

    refs.btnTipoUser.addEventListener(
      'click',
      () => selecionarTipo('user')
    );

    refs.btnTipoAdmin.addEventListener(
      'click',
      () => selecionarTipo('admin')
    );

    refs.formUser.addEventListener(
      'submit',
      loginUsuario
    );

    refs.formAdmin.addEventListener(
      'submit',
      loginAdmin
    );

    refs.searchInput.addEventListener(
      'input',
      filtrarItens
    );

    refs.itemForm.addEventListener(
      'submit',
      cadastrarItem
    );

    document
      .querySelectorAll('[data-action]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          () => {
            const action =
              button.dataset.action;

            if (action === 'logout')
              sair();

            if (action === 'mural')
              irParaMural();

            if (action === 'admin')
              irParaAdmin();
          }
        );
      });
  }

  function inicializarApp() {
    initRefs();
    bindEvents();
    selecionarTipo('user');

    const perfil =
      localStorage.getItem(
        STORAGE_KEYS.perfil
      );

    if (
      perfil === 'admin' ||
      perfil === 'usuario'
    ) {
      irParaMural();
      return;
    }

    mostrarTela(
      'screenLogin'
    );
  }

  document.addEventListener(
    'DOMContentLoaded',
    inicializarApp
  );
})();