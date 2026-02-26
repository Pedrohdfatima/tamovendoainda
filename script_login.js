document.addEventListener('DOMContentLoaded', () => {

    // ICONES UTILIZADOS NO LOGIN

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('main-container');

    // ANIMAÇÃO DE TROCA DE PAGINAS DE ENTRAR E CADASTRAR
    if (signUpButton && signInButton && container) {
        signUpButton.addEventListener('click', () => {
            container.classList.add("right-panel-active");
        });

        signInButton.addEventListener('click', () => {
            container.classList.remove("right-panel-active");
        });
    }

    // permitir Enter em qualquer campo de input para disparar redirecionamento
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target && e.target.tagName === 'INPUT') {
            irParaDash(e);
        }
    });
});
            // ANIMAÇÃO DE TROCA DE PAGINAS DE ENTRAR E CADASTRAR





/**
REDIRECIONAMENTO!!! (ACONTECE QUANDO APERTA EM ENTRAR OU CADASTRAR)
*/
function irParaDash(event) {
    // previne envio de formulário se for acionado como submit
    if (event && event.preventDefault) {
        event.preventDefault();
    }
    console.log("Redirecionando para o Dashboard...");
    window.location.href = "dashboard.html";
}

