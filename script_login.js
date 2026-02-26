document.addEventListener('DOMContentLoaded', () => {

    // ICONES UTILIZADOS NO LOGIN

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('main-container');

                                // ICONES UTILIZADOS NO LOGIN



                                

    // ANIMAÇÃO DE TROCA DE PAGINAS DE ENTRAR E CADASTRAR
    if (signUpButton && signInButton && container) {
        signUpButton.addEventListener('click', () => {
            container.classList.add("right-panel-active");
        });

        signInButton.addEventListener('click', () => {
            container.classList.remove("right-panel-active");
        });
    }
});
            // ANIMAÇÃO DE TROCA DE PAGINAS DE ENTRAR E CADASTRAR





/**
REDIRECIONAMENTO!!! (ACONTECE QUANDO APERTA EM ENTRAR OU CADASTRAR)
 */
function irParaDash() {


    
    // Exibe um feedback rápido (opcional)
    console.log("Redirecionando para o Dashboard...");
    


    // Redireciona para o arquivo index.html
    window.location.href = "dashboard.html"; 
}

