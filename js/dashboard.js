// dashboard.js
// Controla toda a lógica do dashboard:
// - valida sessão do usuário
// - exibe KPIs
// - lista pedidos
// - troca abas (Dashboard / Pedidos / Fornecedores / Perfil)
// - modais (novo pedido e edição)
// - edição de perfil e logout
// Também não usa ES Modules para funcionar ao abrir via file://.

// Importa (via objeto global) as funções do “banco de dados” local (localStorage).
const {
  clearCurrentUser,
  getCurrentUser,
  getOrdersForCurrentUser,
  saveOrdersForCurrentUser,
  seedDemoOrdersIfEmpty,
  updateProfile
} = window.LogiHubStorage || {};

// Estado em memória: lista de pedidos do usuário atual.
let pedidos = [];

// Inicialização: roda quando o DOM estiver pronto.
document.addEventListener('DOMContentLoaded', () => {
  // Se o storage não estiver carregado, nada funciona (abas/modais/tabela).
  if (!clearCurrentUser || !getCurrentUser || !getOrdersForCurrentUser || !saveOrdersForCurrentUser || !seedDemoOrdersIfEmpty || !updateProfile) {
    alert('Erro: storage.js não carregou. Verifique se o script ./js/storage.js está incluído antes de dashboard.js.');
    return;
  }

  // Bloqueia o acesso ao dashboard sem estar logado.
  const user = getCurrentUser();
  if (!user?.email) {
    window.location.href = './index.html';
    return;
  }

  // Renderiza ícones (Lucide).
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Mostra o nome/email do usuário no header.
  const headerUsuario = document.getElementById('header-usuario');
  if (headerUsuario) {
    headerUsuario.textContent = user.nome || user.email;
    headerUsuario.classList.remove('hidden');
  }

  // Garante que existam pedidos demo (somente se o usuário não tiver nenhum).
  seedDemoOrdersIfEmpty();

  // Carrega pedidos do usuário atual do localStorage para a variável em memória.
  pedidos = getOrdersForCurrentUser();

  // Preenche UI inicial.
  atualizarDashboard();
  atualizarTabelaPedidos();
  preencherPerfil();
});

// Formata um número para moeda brasileira (R$).
function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
}

// Calcula KPIs a partir da lista em memória.
function calcularEstatisticas() {
  return {
    total: pedidos.length,
    pendentes: pedidos.filter(p => p.status === 'Pendente').length,
    em_rota: pedidos.filter(p => p.status === 'Em Rota').length,
    entregue: pedidos.filter(p => p.status === 'Entregue').length,
    valor_total: pedidos.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0)
  };
}

// Atualiza os cards de KPI do Dashboard.
function atualizarDashboard() {
  const stats = calcularEstatisticas();
  document.getElementById('num-total').innerText = stats.total;
  document.getElementById('num-pendentes').innerText = stats.pendentes;
  document.getElementById('num-rota').innerText = stats.em_rota;
  document.getElementById('num-entregue').innerText = stats.entregue;
  document.getElementById('num-valor-total').innerText = formatarMoeda(stats.valor_total);
}

// Renderiza a tabela de pedidos e liga os botões de edição.
function atualizarTabelaPedidos() {
  const tabela = document.getElementById('corpo-tabela-pedidos');
  tabela.innerHTML = '';

  pedidos.forEach(pedido => {
    const linhaHtml = `
      <tr class="border-b text-gray-700 hover:bg-blue-50 transition">
        <td class="p-4 font-mono text-xs">#${pedido.id_pedido}</td>
        <td class="p-4">
          <div class="font-bold">${pedido.nome_cliente}</div>
          <div class="text-[9px] text-gray-400 italic">Valor: ${formatarMoeda(pedido.valor_total)}</div>
        </td>
        <td class="p-4 font-semibold text-gray-600">${formatarMoeda(pedido.valor_total)}</td>
        <td class="p-4">
          <span class="status-badge ${(pedido.status || '').replace(' ', '-').toLowerCase()}">${pedido.status}</span>
        </td>
        <td class="p-4 text-center">
          <button data-id="${pedido.id_pedido}" class="btn-editar text-blue-400 hover:text-blue-600"><i data-lucide="edit" class="w-4 h-4"></i></button>
        </td>
      </tr>
    `;
    tabela.innerHTML += linhaHtml;
  });

  tabela.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => abrirEdicaoPedido(Number(btn.getAttribute('data-id'))));
  });

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Abas (navegação lateral)
// Esta função fica em window porque o HTML usa onclick="trocarAba('pedidos', this)".
window.trocarAba = function trocarAba(id, btn) {
  // Esconde todas as abas e exibe só a selecionada.
  document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
  document.getElementById(`aba-${id}`).classList.add('ativa');

  // Atualiza o estado visual dos botões do menu.
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const titulos = {
    dashboard: 'Dashboard',
    pedidos: 'Lista de Pedidos',
    fornecedores: 'Fornecedores',
    perfil: 'Perfil'
  };
  document.getElementById('titulo-pagina').innerText = titulos[id] || id;

  // Exemplo de regra de UI: oculta “Novo Pedido” na aba Perfil.
  const btnNovoPedido = document.getElementById('btn-novo-pedido');
  if (btnNovoPedido) {
    btnNovoPedido.classList.toggle('hidden', id === 'perfil');
  }
};

// Modal: Novo Pedido
// Também fica em window por causa do onclick no HTML.
window.toggleModal = function toggleModal(abrir) {
  const modal = document.getElementById('modal-container');
  // O CSS usa display:flex para mostrar; sem a classe, o modal fica oculto.
  abrir ? modal.classList.add('flex') : modal.classList.remove('flex');
};

// Mostra/esconde o campo de parcelas quando o pedido é “Parcelado”.
window.toggleParcelas = function toggleParcelas() {
  const isParcelado = document.getElementById('form-parcelado').value === 'sim';
  document.getElementById('div-parcelas').classList.toggle('hidden', !isParcelado);
};

// Formata input de dinheiro (digita números → vira R$ x.xxx,xx).
window.formatarValor = function formatarValor(input) {
  let valor = input.value.replace(/\D/g, '');
  if (valor === '') {
    input.value = '';
    return;
  }
  valor = parseInt(valor, 10) / 100;
  input.value = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Lê o formulário do modal e cria um novo pedido.
window.salvarNovoPedido = function salvarNovoPedido() {
  // Coleta campos e converte valores.
  const nome = (document.getElementById('form-cliente').value || '').trim();
  const valorFormatado = document.getElementById('form-valor').value || '';
  const valorTotal = parseFloat(valorFormatado.replace(/\D/g, '')) / 100 || 0;
  const status = document.getElementById('form-status').value;
  const isParcelado = document.getElementById('form-parcelado').value === 'sim';
  const numParcelas = parseInt(document.getElementById('form-num-parcelas').value || '1', 10) || 1;

  if (!nome || valorTotal === 0) {
    alert('Preencha nome e valor!');
    return;
  }

  // Define próximo ID (simples: maior id + 1).
  const nextId = pedidos.length ? Math.max(...pedidos.map(p => Number(p.id_pedido))) + 1 : 1;
  const novoPedido = {
    id_pedido: nextId,
    nome_cliente: nome,
    valor_total: valorTotal,
    status,
    parcelado: isParcelado,
    num_parcelas: numParcelas,
    data_pedido: new Date().toISOString()
  };

  // Atualiza estado em memória + persiste no localStorage.
  pedidos.unshift(novoPedido);
  saveOrdersForCurrentUser(pedidos);

  // Re-renderiza a UI e fecha o modal.
  atualizarDashboard();
  atualizarTabelaPedidos();
  window.toggleModal(false);

  document.getElementById('form-cliente').value = '';
  document.getElementById('form-valor').value = '';
  document.getElementById('form-obs').value = '';
  document.getElementById('form-parcelado').value = 'nao';
  document.getElementById('form-status').value = 'Pendente';

  alert('Pedido criado com sucesso!');
};

// Modal: Edição de Pedido
window.toggleModalEdicao = function toggleModalEdicao(abrir) {
  const modal = document.getElementById('modal-editar-pedido');
  abrir ? modal.classList.add('flex') : modal.classList.remove('flex');
};

// Mostra/esconde o campo de parcelas no modal de edição.
window.toggleModalParcelas = function toggleModalParcelas() {
  const isParcelado = document.getElementById('modal-editar-parcelado').value === 'true';
  document.getElementById('modal-editar-div-parcelas').classList.toggle('hidden', !isParcelado);
};

// Abre o modal já preenchido com os dados do pedido.
function abrirEdicaoPedido(id_pedido) {
  const pedido = pedidos.find(p => Number(p.id_pedido) === Number(id_pedido));
  if (!pedido) return;

  document.getElementById('modal-editar-id').value = pedido.id_pedido;
  document.getElementById('modal-editar-cliente').value = pedido.nome_cliente;
  document.getElementById('modal-editar-valor').value = formatarMoeda(pedido.valor_total);
  document.getElementById('modal-editar-status').value = pedido.status;
  document.getElementById('modal-editar-parcelado').value = pedido.parcelado ? 'true' : 'false';
  document.getElementById('modal-editar-num-parcelas').value = pedido.num_parcelas || 1;

  window.toggleModalParcelas();
  window.toggleModalEdicao(true);
}

// Salva alterações feitas no modal de edição.
window.salvarEdicaoPedidoModal = function salvarEdicaoPedidoModal() {
  const id_pedido = Number(document.getElementById('modal-editar-id').value);
  const valorFormatado = document.getElementById('modal-editar-valor').value || '';
  const valorTotal = parseFloat(valorFormatado.replace(/\D/g, '')) / 100 || 0;
  const status = document.getElementById('modal-editar-status').value;
  const parcelado = document.getElementById('modal-editar-parcelado').value === 'true';
  const numParcelas = parseInt(document.getElementById('modal-editar-num-parcelas').value || '1', 10) || 1;

  // Encontra o pedido em memória, aplica mudanças e persiste.
  const pedido = pedidos.find(p => Number(p.id_pedido) === id_pedido);
  if (!pedido) {
    alert('Pedido não encontrado');
    return;
  }

  pedido.valor_total = valorTotal;
  pedido.status = status;
  pedido.parcelado = parcelado;
  pedido.num_parcelas = numParcelas;

  saveOrdersForCurrentUser(pedidos);
  atualizarDashboard();
  atualizarTabelaPedidos();
  window.toggleModalEdicao(false);
  alert('Pedido atualizado com sucesso!');
};

// Perfil do usuário
// Preenche a área “Minha Conta” e o formulário de edição.
function preencherPerfil() {
  const user = getCurrentUser();
  document.getElementById('perfil-nome').textContent = user?.nome || '—';
  document.getElementById('perfil-email').textContent = user?.email || '—';
  document.getElementById('perfil-input-nome').value = user?.nome || '';
}

// “Atualizar” manual (recarrega a UI a partir do storage).
window.carregarSessaoUsuario = function carregarSessaoUsuario() {
  preencherPerfil();
  alert('Perfil atualizado');
};

// Salva alterações do perfil (nome e/ou senha).
window.salvarPerfil = function salvarPerfil() {
  const nome = (document.getElementById('perfil-input-nome')?.value || '').trim();
  const senhaAtual = document.getElementById('perfil-senha-atual')?.value || '';
  const senhaNova = document.getElementById('perfil-senha-nova')?.value || '';
  const senhaConfirm = document.getElementById('perfil-senha-confirm')?.value || '';

  // updateProfile valida senha atual, confirmações e persistência do usuário.
  const result = updateProfile({ nome, senhaAtual, senhaNova, senhaConfirm });
  if (!result.ok) {
    alert(result.message);
    return;
  }

  document.getElementById('perfil-senha-atual').value = '';
  document.getElementById('perfil-senha-nova').value = '';
  document.getElementById('perfil-senha-confirm').value = '';

  // Atualiza header com novo nome (se tiver sido alterado).
  preencherPerfil();
  const headerUsuario = document.getElementById('header-usuario');
  const user = getCurrentUser();
  if (headerUsuario && user) headerUsuario.textContent = user.nome || user.email;

  alert(result.message);
};

// Encerra a sessão removendo o usuário atual do localStorage.
window.logout = function logout() {
  clearCurrentUser();
  window.location.href = './index.html';
};
