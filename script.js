// Inicializa os ícones do Lucide
lucide.createIcons();

let fornecedores = [];
let pedidoSendoEditado = null; 



// FORMATAÇÃO DE MOEDA PRA BR   
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
}

// FORMATAÇÃO DE MOEDA PRA BR 



// Navegação entre abas
function trocarAba(id, btn) {
    document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
    document.getElementById(`aba-${id}`).classList.add('ativa');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('titulo-pagina').innerText = id;
}

                                // Navegação entre abas




   // Controle do Modal (CAIXA DE FORMS)
function toggleModal(abrir) {
    const modal = document.getElementById('modal-container');
    if (!abrir) {
        document.getElementById('form-cliente').value = "";
        document.getElementById('form-valor').value = "";
        document.getElementById('form-obs').value = "";
        document.getElementById('form-fornecedor').selectedIndex = 0;
        document.getElementById('modal-titulo').innerText = "📦 Novo Pedido Logístico";
        document.getElementById('btn-salvar').innerText = "Cadastrar";
        pedidoSendoEditado = null;
    }
    abrir ? modal.classList.add('flex') : modal.classList.remove('flex');
}
                // Controle do Modal (CAIXA DE FORMS)




// Mostrar/Esconder campo de parcelas
function toggleParcelas() {
    const select = document.getElementById('form-parcelado');
    const div = document.getElementById('div-parcelas');
    div.classList.toggle('hidden', select.value !== 'sim');
}

                        // Mostrar/Esconder campo de parcelas



// Máscara de CNPJ
function mascaraCNPJ(input) {
    let v = input.value.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    input.value = v;
}
                            // Máscara de CNPJ





                                // Cadastro de Fornecedor
function cadastrarFornecedor() {
    const nome = document.getElementById('forn-nome').value;
    const cnpj = document.getElementById('forn-cnpj').value;
    if (!nome) return alert("Preencha o nome!");

    fornecedores.push({ nome, cnpj });
    document.getElementById('tabela-fornecedores-body').innerHTML += `
        <tr class="border-b text-gray-700">
            <td class="p-4 font-bold text-blue-600">${nome}</td>
            <td class="p-4 font-mono text-sm">${cnpj || '---'}</td>
        </tr>`;

    const select = document.getElementById('form-fornecedor');
    const option = document.createElement('option');
    option.value = nome; option.text = nome;
    select.add(option);
    
    document.getElementById('forn-nome').value = "";
    document.getElementById('forn-cnpj').value = "";
    alert("Fornecedor cadastrado com sucesso!");
}

                     // Cadastro de Fornecedor






// EDIÇÃO DE PEDIDO


function editarPedido(btn) {
    pedidoSendoEditado = btn.closest('tr');
    
    const nome = pedidoSendoEditado.querySelector('.celula-nome').innerText;
    const valorRaw = pedidoSendoEditado.querySelector('.celula-valor').getAttribute('data-valor');
    const status = pedidoSendoEditado.querySelector('.status-badge').innerText;
    const obs = pedidoSendoEditado.querySelector('.celula-obs').innerText.replace('Obs: ', '');

    document.getElementById('form-cliente').value = nome;
    document.getElementById('form-valor').value = valorRaw;
    document.getElementById('form-status').value = status;
    document.getElementById('form-obs').value = obs;

    document.getElementById('modal-titulo').innerText = "📝 Editar Pedido";
    document.getElementById('btn-salvar').innerText = "Atualizar Pedido";
    
    toggleModal(true);
}

                                // EDIÇÃO DE PEDIDO







    // EDIÇÃO DE PEDIDOS SALVAR (EXTREMAMENTE IMPORTANTE CUIDADO AO MEXER !!!!!!!!!!!!!!)
function salvarNovoPedido() {
    const nome = document.getElementById('form-cliente').value;
    const fornecedor = document.getElementById('form-fornecedor').value;
    const valorTotal = parseFloat(document.getElementById('form-valor').value);
    const status = document.getElementById('form-status').value;
    const obs = document.getElementById('form-obs').value;

    if (!nome || isNaN(valorTotal)) return alert("Preencha nome e valor!");

    if (pedidoSendoEditado) {
        pedidoSendoEditado.querySelector('.celula-nome').innerText = nome;
        pedidoSendoEditado.querySelector('.celula-forn').innerText = `Forn: ${fornecedor || 'N/A'}`;
        pedidoSendoEditado.querySelector('.celula-valor').innerText = formatarMoeda(valorTotal);
        pedidoSendoEditado.querySelector('.celula-valor').setAttribute('data-valor', valorTotal);
        pedidoSendoEditado.querySelector('.celula-obs').innerText = obs ? 'Obs: ' + obs : '';
        
        const badge = pedidoSendoEditado.querySelector('.status-badge');
        badge.className = `status-badge ${status.replace(/\s+/g, '-').toLowerCase()}`;
        badge.innerText = status;
    } else {
        const idPedido = Date.now().toString().slice(-4);
        const tabela = document.getElementById('corpo-tabela-pedidos');
        
        const linhaHtml = `
            <tr class="border-b text-gray-700 hover:bg-blue-50 transition">
                <td class="p-4 font-mono text-xs">#PI-${idPedido}</td>
                <td class="p-4">
                    <div class="font-bold celula-nome">${nome}</div>
                    <div class="text-[10px] text-blue-500 uppercase font-black celula-forn">Forn: ${fornecedor || 'N/A'}</div>
                    <div class="text-[9px] text-gray-400 italic celula-obs">${obs ? 'Obs: ' + obs : ''}</div>
                </td>
                <td class="p-4 font-semibold text-gray-600 celula-valor" data-valor="${valorTotal}">${formatarMoeda(valorTotal)}</td>
                <td class="p-4"><span class="status-badge ${status.replace(/\s+/g, '-').toLowerCase()}">${status}</span></td>
                <td class="p-4 text-center flex gap-2 justify-center">
                    <button onclick="editarPedido(this)" class="text-blue-400 hover:text-blue-600"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                    <button onclick="removerPedido(this)" class="text-red-400 hover:text-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>`;
        tabela.insertAdjacentHTML('beforeend', linhaHtml);
    }

    lucide.createIcons();
    toggleModal(false);
    atualizarKPIs();
}
// EDIÇÃO DE PEDIDOS SALVAR (EXTREMAMENTE IMPORTANTE CUIDADO AO MEXER !!!!!!!!!!!!!!)









                    // AREA DE Remover PEDIDOS
function removerPedido(btn) {
    if(confirm("Tem certeza que deseja excluir este pedido?")) {
        btn.closest('tr').remove();
        atualizarKPIs();
    }
}

                            // AREA DE Remover PEDIDOS




// Recalcular KPIs
function atualizarKPIs() {
    let totalPedidos = 0, valorAcumulado = 0, pendentes = 0, emRota = 0;
    const linhas = document.querySelectorAll('#corpo-tabela-pedidos tr');

    linhas.forEach(linha => {
        totalPedidos++;
        const valor = parseFloat(linha.querySelector('.celula-valor').getAttribute('data-valor')) || 0;
        valorAcumulado += valor;

        const statusTexto = linha.querySelector('.status-badge').innerText.trim();
        if (statusTexto === "Pendentes") pendentes++;
        if (statusTexto === "Em Rota") emRota++;
    });

    document.getElementById('num-total').innerText = totalPedidos;
    document.getElementById('num-valor-total').innerText = formatarMoeda(valorAcumulado);
    document.getElementById('num-pendentes').innerText = pendentes;
    document.getElementById('num-rota').innerText = emRota;
}




// salvar preferencia
// Função para Salvar as Preferências
function salvarPreferencias() {
    const nome = document.getElementById('pref-nome').value;
    const cargo = document.getElementById('pref-cargo').value;
    const email = document.getElementById('pref-email').value;
    const senha = document.getElementById('pref-senha').value;
    const confirma = document.getElementById('pref-senha-confirma').value;

    // Validação de Senha
    if (senha !== "" || confirma !== "") {
        if (senha.length < 8) {
            alert("A senha deve ter pelo menos 8 caracteres.");
            return;
        }
        if (senha !== confirma) {
            alert("As senhas não coincidem!");
            return;
        }
    }

    // Objeto com os dados
    const dadosUsuario = {
        nome,
        cargo,
        email,
        tema: document.getElementById('pref-tema').value
    };

    // Salva no LocalStorage
    localStorage.setItem('logihub_user_data', JSON.stringify(dadosUsuario));
    
    alert("Perfil atualizado com sucesso!");
    
    // Opcional: Atualizar nome na interface em tempo real
    // document.getElementById('nome-usuario-sidebar').innerText = nome;
}

// Chamar esta função ao carregar a página (DOMContentLoaded)
function carregarDadosPerfil() {
    const salvo = localStorage.getItem('logihub_user_data');
    if (salvo) {
        const dados = JSON.parse(salvo);
        document.getElementById('pref-nome').value = dados.nome || "";
        document.getElementById('pref-cargo').value = dados.cargo || "";
        document.getElementById('pref-email').value = dados.email || "";
        document.getElementById('pref-tema').value = dados.tema || "padrao";
    }
}

// Adicione à sua função trocarAba o refresh dos ícones
// function trocarAba(id, btn) { ... lucide.createIcons(); }

// Função para encerrar a sessão
function logout() {
    // Caso use localStorage para login, limpe aqui
    // localStorage.removeItem('logihub_auth'); 

    if (confirm("Deseja realmente sair do sistema?")) {
        // Redireciona para a sua página de cadastro/login
        window.location.href = "cadastro.html";
    }
}