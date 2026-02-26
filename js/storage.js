// storage.js
// Camada de “persistência” e “regras de negócio” (bem simples) usando localStorage.
// Nesta versão HTML demo, não existe backend: o navegador é o banco de dados.
//
// Observação importante:
// Este arquivo NÃO usa ES Modules (import/export) de propósito.
// Assim ele funciona mesmo abrindo o HTML direto (file://) sem servidor.

(function initStorage(global) {
  // IIFE (Immediately Invoked Function Expression): cria um “escopo privado”
  // para as funções internas e exporta só o que o app precisa em window.LogiHubStorage.

  // Parse de JSON com fallback para evitar quebrar em caso de dados corrompidos.
  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  // ===== Usuários / sessão =====
  // Usuários ficam guardados em um objeto (mapa) na chave 'logihub_users'.
  function getUsers() {
    return safeJsonParse(localStorage.getItem('logihub_users'), {});
  }

  // Persiste o mapa de usuários.
  function saveUsers(users) {
    localStorage.setItem('logihub_users', JSON.stringify(users));
  }

  // Sessão atual (usuário logado) em 'logihub_current_user'.
  function getCurrentUser() {
    return safeJsonParse(localStorage.getItem('logihub_current_user'), null);
  }

  // Grava o usuário atual (apenas dados necessários para sessão).
  function setCurrentUser(user) {
    localStorage.setItem('logihub_current_user', JSON.stringify(user));
  }

  // Logout: remove a sessão atual.
  function clearCurrentUser() {
    localStorage.removeItem('logihub_current_user');
  }

  // Cria um usuário admin padrão para facilitar a demo.
  function ensureSeedAdmin() {
    const users = getUsers();
    if (!users['admin@logihub.local']) {
      users['admin@logihub.local'] = {
        id: 'u_admin',
        nome: 'Administrador',
        email: 'admin@logihub.local',
        // Senha em texto simples (modo demo local). Para produção, não faça isso.
        password: '123456'
      };
      saveUsers(users);
    }
  }

  // Normaliza email (trim + lowercase) para evitar duplicidade.
  function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
  }

  // Cadastro: valida dados, cria usuário e já inicia sessão.
  function signup({ nome, email, password, confirm }) {
    ensureSeedAdmin();
    const users = getUsers();
    const em = normalizeEmail(email);

    if (!nome || !em || !password) {
      return { ok: false, message: 'Todos os campos são obrigatórios' };
    }
    if (!em.includes('@')) {
      return { ok: false, message: 'Email inválido' };
    }
    if (confirm && password !== confirm) {
      return { ok: false, message: 'As senhas não correspondem' };
    }
    if (password.length < 6) {
      return { ok: false, message: 'Senha deve ter pelo menos 6 caracteres' };
    }
    if (users[em]) {
      return { ok: false, message: 'Email já cadastrado. Faça login.' };
    }

    // Cria usuário com id “único” (suficiente para demo local).
    const user = {
      id: `u_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`,
      nome: nome.trim(),
      email: em,
      password
    };

    users[em] = user;
    saveUsers(users);
    setCurrentUser({ id: user.id, nome: user.nome, email: user.email });

    return { ok: true, message: `Bem-vindo, ${user.nome}! Sua conta foi criada.` };
  }

  // Login: valida credenciais e grava sessão atual.
  function login({ email, password }) {
    ensureSeedAdmin();
    const users = getUsers();
    const em = normalizeEmail(email);
    const pw = (password || '').toString();

    if (!em || !pw) {
      return { ok: false, message: 'Email e senha são obrigatórios' };
    }

    const user = users[em];
    if (!user) {
      return { ok: false, message: 'Usuário não encontrado. Faça o cadastro.' };
    }
    if (user.password !== pw) {
      return { ok: false, message: 'Senha incorreta.' };
    }

    setCurrentUser({ id: user.id, nome: user.nome, email: user.email });
    return { ok: true, message: `Bem-vindo, ${user.nome}!` };
  }

  // Atualização de perfil:
  // - permite alterar nome
  // - opcionalmente altera senha (exige senha atual)
  function updateProfile({ nome, senhaAtual, senhaNova, senhaConfirm }) {
    const current = getCurrentUser();
    if (!current?.email) {
      return { ok: false, message: 'Não autenticado' };
    }

    const users = getUsers();
    const user = users[current.email];
    if (!user) {
      return { ok: false, message: 'Usuário não encontrado' };
    }

    if (nome && nome.trim()) {
      user.nome = nome.trim();
      current.nome = user.nome;
      setCurrentUser(current);
    }

    const wantsPasswordChange = !!(senhaAtual || senhaNova || senhaConfirm);
    if (wantsPasswordChange) {
      if (!senhaAtual || !senhaNova) {
        return { ok: false, message: 'Para alterar a senha, informe senha atual e nova senha' };
      }
      if (senhaConfirm && senhaNova !== senhaConfirm) {
        return { ok: false, message: 'As senhas não correspondem' };
      }
      if (senhaNova.length < 6) {
        return { ok: false, message: 'Senha deve ter pelo menos 6 caracteres' };
      }
      if (user.password !== senhaAtual) {
        return { ok: false, message: 'Senha atual incorreta' };
      }
      user.password = senhaNova;
    }

    users[current.email] = user;
    saveUsers(users);

    return { ok: true, message: 'Perfil atualizado com sucesso' };
  }

  // ===== Pedidos =====
  // Cada usuário tem sua própria lista de pedidos, em uma chave derivada do email.
  function ordersKey(email) {
    return `logihub_orders_${normalizeEmail(email)}`;
  }

  // Retorna os pedidos do usuário atual.
  function getOrdersForCurrentUser() {
    const current = getCurrentUser();
    if (!current?.email) return [];
    return safeJsonParse(localStorage.getItem(ordersKey(current.email)), []);
  }

  // Persiste pedidos do usuário atual.
  function saveOrdersForCurrentUser(orders) {
    const current = getCurrentUser();
    if (!current?.email) return;
    localStorage.setItem(ordersKey(current.email), JSON.stringify(orders));
  }

  // Cria pedidos demo na primeira vez que o usuário acessar (se ainda não tiver nenhum).
  function seedDemoOrdersIfEmpty() {
    const current = getCurrentUser();
    if (!current?.email) return;
    const existing = getOrdersForCurrentUser();
    if (existing.length) return;

    const now = new Date();
    const demo = [
      {
        id_pedido: 1,
        nome_cliente: 'João Silva',
        valor_total: 1500.0,
        status: 'Pendente',
        parcelado: true,
        num_parcelas: 3,
        data_pedido: now.toISOString()
      },
      {
        id_pedido: 2,
        nome_cliente: 'Maria Santos',
        valor_total: 2500.0,
        status: 'Em Rota',
        parcelado: false,
        num_parcelas: 1,
        data_pedido: new Date(now.getTime() - 2 * 86400000).toISOString()
      }
    ];

    saveOrdersForCurrentUser(demo);
  }

  // Exporta a API pública para o restante do app.
  // Esses métodos serão consumidos por auth.js e dashboard.js.
  global.LogiHubStorage = {
    ensureSeedAdmin,
    getUsers,
    saveUsers,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    signup,
    login,
    updateProfile,
    getOrdersForCurrentUser,
    saveOrdersForCurrentUser,
    seedDemoOrdersIfEmpty
  };
})(window);
