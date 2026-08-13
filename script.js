/* ===================== NAVEGAÇÃO ENTRE TELAS ===================== */
function mostrarTela(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function irParaMural() {
  mostrarTela('screenMural');
  const nomeSalvo = localStorage.getItem('usuarioAtivo');
  if (nomeSalvo) document.getElementById('userNameDisplay').textContent = nomeSalvo;
  document.getElementById('navAdminLink').style.display =
    localStorage.getItem('perfil') === 'admin' ? 'inline' : 'none';
  renderizarMural(obterItens());
}

function irParaAdmin() {
  if (localStorage.getItem('perfil') !== 'admin') {
    alert('Acesso negado! Esta área é exclusiva para Administradores.');
    return;
  }
  mostrarTela('screenAdmin');
  carregarTabelaAdmin();
}

function sair() {
  localStorage.clear();
  mostrarTela('screenLogin');
}

/* ===================== LOGIN ===================== */
let tipoAtual = 'user';

function selecionarTipo(tipo) {
  tipoAtual = tipo;
  const btnUser = document.getElementById('btnTipoUser');
  const btnAdmin = document.getElementById('btnTipoAdmin');
  const formUser = document.getElementById('formUser');
  const formAdmin = document.getElementById('formAdmin');
  const subtitulo = document.getElementById('subtitulo');

  if (tipo === 'user') {
    btnUser.classList.add('active');
    btnAdmin.classList.remove('active', 'admin-mode');
    formUser.style.display = 'block';
    formAdmin.style.display = 'none';
    subtitulo.textContent = 'Acesse o mural de objetos salvos';
  } else {
    btnAdmin.classList.add('active', 'admin-mode');
    btnUser.classList.remove('active');
    formUser.style.display = 'none';
    formAdmin.style.display = 'block';
    subtitulo.textContent = 'Painel restrito à equipe de gestão';
  }
}

function loginUsuario(e) {
  e.preventDefault();
  const login = document.getElementById('userEmail').value;
  localStorage.setItem('usuarioAtivo', login.split('@')[0]);
  localStorage.setItem('perfil', 'usuario');
  irParaMural();
}

// Lista de administradores. Adicione ou edite pares { user, pass } aqui.
const ADMINS = [
  { user: 'admin', pass: '1234' },
  // { user: 'maria', pass: 'senha123' },
  // { user: 'joao', pass: 'outraSenha' },
];

function loginAdmin(e) {
  e.preventDefault();
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminSenha').value;

  const encontrado = ADMINS.find(a => a.user === user && a.pass === pass);

  if (encontrado) {
    localStorage.setItem('usuarioAtivo', encontrado.user);
    localStorage.setItem('perfil', 'admin');
    irParaAdmin();
  } else {
    alert('Credenciais de administrador incorretas!');
  }
}

/* ===================== MURAL ===================== */
const itensIniciais = [
  { id: 1, titulo: 'Chaveiro de Carro', status: 'achado', local: 'Estacionamento Bloco B', data: '10/08/2026', img: 'https://via.placeholder.com/300x180?text=Chaveiro', desc: 'Chaveiro de couro preto com 3 chaves.' },
  { id: 2, titulo: 'Mochila Azul', status: 'perdido', local: 'Biblioteca - 2º Andar', data: '11/08/2026', img: 'https://via.placeholder.com/300x180?text=Mochila', desc: 'Mochila com cadernos e um estojo.' },
  { id: 3, titulo: 'Garrafa Térmica', status: 'achado', local: 'Praça de Alimentação', data: '12/08/2026', img: 'https://via.placeholder.com/300x180?text=Garrafa', desc: 'Garrafa térmica metálica cor prata.' }
];

function obterItens() {
  const cadastrados = JSON.parse(localStorage.getItem('itensCadastrados')) || [];
  return [...itensIniciais, ...cadastrados];
}

function renderizarMural(lista) {
  const grid = document.getElementById('muralGrid');
  grid.innerHTML = '';

  if (lista.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted)">Nenhum item encontrado.</p>';
    return;
  }

  lista.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <img src="${item.img}" alt="${item.titulo}" onerror="this.src='https://via.placeholder.com/300x180?text=Sem+Imagem'" />
      <div class="item-content">
        <div class="item-header">
          <span class="badge ${item.status}">${item.status.toUpperCase()}</span>
        </div>
        <div class="item-title">${item.titulo}</div>
        <div class="item-desc">${item.desc}</div>
        <div class="item-meta">
          <strong>Local:</strong> ${item.local}<br>
          <strong>Data:</strong> ${item.data}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filtrarItens() {
  const termo = document.getElementById('searchInput').value.toLowerCase();
  const todos = obterItens();
  const filtrados = todos.filter(i =>
    i.titulo.toLowerCase().includes(termo) ||
    i.local.toLowerCase().includes(termo) ||
    i.desc.toLowerCase().includes(termo)
  );
  renderizarMural(filtrados);
}

/* ===================== ADMIN ===================== */
function cadastrarItem(event) {
  event.preventDefault();

  const novoItem = {
    id: Date.now(),
    titulo: document.getElementById('titulo').value,
    status: document.getElementById('status').value,
    local: document.getElementById('local').value,
    data: document.getElementById('data').value,
    desc: document.getElementById('desc').value,
    img: 'https://via.placeholder.com/300x180?text=Item',
  };

  const cadastrados = JSON.parse(localStorage.getItem('itensCadastrados')) || [];
  cadastrados.push(novoItem);
  localStorage.setItem('itensCadastrados', JSON.stringify(cadastrados));

  document.getElementById('itemForm').reset();
  carregarTabelaAdmin();
  alert('Item cadastrado com sucesso!');
}

function removerItem(id) {
  let cadastrados = JSON.parse(localStorage.getItem('itensCadastrados')) || [];
  cadastrados = cadastrados.filter(i => i.id !== id);
  localStorage.setItem('itensCadastrados', JSON.stringify(cadastrados));
  carregarTabelaAdmin();
}

function carregarTabelaAdmin() {
  const cadastrados = JSON.parse(localStorage.getItem('itensCadastrados')) || [];
  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = '';

  if (cadastrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">Nenhum item cadastrado manualmente.</td></tr>';
    return;
  }

  cadastrados.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.titulo}</td>
      <td><strong style="color: ${item.status === 'achado' ? '#10b981' : '#ef4444'}">${item.status.toUpperCase()}</strong></td>
      <td>${item.data}</td>
      <td><button class="btn-delete" onclick="removerItem(${item.id})">Excluir</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ===================== INICIALIZAÇÃO ===================== */
document.addEventListener('DOMContentLoaded', () => {
  const perfil = localStorage.getItem('perfil');
  if (perfil === 'admin' || perfil === 'usuario') {
    irParaMural();
  } else {
    mostrarTela('screenLogin');
  }
});
