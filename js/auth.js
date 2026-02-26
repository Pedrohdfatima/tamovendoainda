// auth.js
// Responsável pela tela de login/cadastro.
// Repare que NÃO usamos ES Modules aqui: abrindo o HTML via file://,
// alguns browsers bloqueiam import/export. Por isso, acessamos o storage pelo objeto global.

// Importa (via objeto global) as funções de persistência/autenticação.
const { ensureSeedAdmin, getCurrentUser, login, signup } = window.LogiHubStorage || {};

// Espera o HTML estar pronto antes de buscar elementos e anexar listeners.
document.addEventListener('DOMContentLoaded', () => {
  // Se o storage não estiver carregado, nenhum clique/submissão funcionará.
  // Isso normalmente acontece quando storage.js não foi incluído antes deste arquivo.
  if (!ensureSeedAdmin || !getCurrentUser || !login || !signup) {
    alert('Erro: storage.js não carregou. Verifique se o script ./js/storage.js está incluído antes de auth.js.');
    return;
  }

  // Garante que existe um usuário demo (admin@logihub.local / 123456).
  ensureSeedAdmin();

  // Se já estiver logado, manda pro dashboard e evita mostrar a tela de login.
  const current = getCurrentUser();
  if (current?.email) {
    window.location.href = './dashboard.html';
    return;
  }

  // Renderiza ícones (biblioteca Lucide) que foram colocados no HTML com data-lucide="...".
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');
  const container = document.getElementById('main-container');

  // Alterna a “tela” visual entre Entrar e Criar Conta.
  // Isso funciona adicionando/removendo uma classe no container (ver CSS: right-panel-active).
  if (signUpButton && signInButton && container) {
    signUpButton.addEventListener('click', () => container.classList.add('right-panel-active'));
    signInButton.addEventListener('click', () => container.classList.remove('right-panel-active'));
  }

  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  // Envio do formulário de login.
  // Em modo HTML demo, o “backend” é o localStorage.
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (document.getElementById('login-email')?.value || '').trim();
      const password = document.getElementById('login-password')?.value || '';

      // Valida credenciais e grava a sessão (logihub_current_user).
      const result = login({ email, password });
      if (!result.ok) {
        alert(result.message);
        return;
      }

      // Login ok → abre o dashboard.
      window.location.href = './dashboard.html';
    });
  }

  // Envio do formulário de cadastro.
  // Cria usuário no localStorage e já loga na sequência.
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = (document.getElementById('signup-name')?.value || '').trim();
      const email = (document.getElementById('signup-email')?.value || '').trim();
      const password = document.getElementById('signup-password')?.value || '';

      // Valida e cadastra no armazenamento local.
      const result = signup({ nome, email, password });
      if (!result.ok) {
        alert(result.message);
        return;
      }

      // Cadastro ok → abre o dashboard.
      window.location.href = './dashboard.html';
    });
  }
});
