
const baseURLLocatarios = "https://locadora-ryan-back.altislabtech.com.br/renter";
const token = localStorage.getItem("token");

let locatarios = [];
let locatariosFiltrados = [];
let paginaAtual = 1;
const porPagina = 8;
let editandoId = null; // guarda o ID que está sendo editado

let ordenacaoAtual = {
    coluna: null, 
    crescente: true
};
function ordenarTabelaPor(coluna) {
    if (ordenacaoAtual.coluna === coluna) {
        // se já estava ordenando por essa coluna, inverte
        ordenacaoAtual.crescente = !ordenacaoAtual.crescente;
    } else {
        ordenacaoAtual.coluna = coluna;
        ordenacaoAtual.crescente = true;
    }

    locatariosFiltrados.sort((a, b) => {
        let valA = a[coluna] || "";
        let valB = b[coluna] || "";

        // transforma para string minúscula (para ordenar texto)
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();

        if (valA < valB) return ordenacaoAtual.crescente ? -1 : 1;
        if (valA > valB) return ordenacaoAtual.crescente ? 1 : -1;
        return 0;
    });

    paginaAtual = 1; // volta para a primeira página
    listarLocatarios();
}

function aplicarRestricoesDeUsuario() {
    const role = localStorage.getItem("role");

    if (role !== "ADMIN") {
        // Esconde botão de cadastrar (caso exista na tela)
        const botoesCadastrar = document.getElementsByClassName("butao-cadastro");
        for (let botao of botoesCadastrar) {
            botao.style.display = "none";
        }

        // Esconde botões de ação nas tabelas
        document.querySelectorAll(".botao-editar, .botao-deletar").forEach(btn => {
            btn.style.display = "none";
        });
    }
}

window.addEventListener("DOMContentLoaded", carregarLocatarios);
async function carregarLocatarios() {
    try {
        const res = await axios.get(baseURLLocatarios, {
            headers: { Authorization: `Bearer ${token}` }
        });
        locatarios = res.data;
        locatariosFiltrados = [...locatarios];
        paginaAtual = 1;
        listarLocatarios();
        renderPaginacao();
    } catch (err) {
        console.error("Erro ao buscar locatários:", err);
    }
}
//------------------------------------------------------------------------------------
function listarLocatarios() {
    const tabela = document.getElementById("tabela-dados").getElementsByTagName("tbody")[0];
    tabela.innerHTML = "";
    const inicio = (paginaAtual - 1) * porPagina;
    const fim = inicio + porPagina;
    const locatariosPagina = locatariosFiltrados.slice(inicio, fim);
    locatariosPagina.forEach(locatario => {
        const row = tabela.insertRow();
        row.insertCell(0).textContent = locatario.id;
        row.insertCell(1).textContent = locatario.name;
        row.insertCell(2).textContent = locatario.email;
        row.insertCell(3).textContent = locatario.telephone;
        row.insertCell(4).textContent = locatario.address;
        row.insertCell(5).textContent = locatario.cpf;
        const acoesCell = row.insertCell(6);
        const divBotoes = document.createElement("div");
        divBotoes.className = "acoes-container";
        divBotoes.style.display = "flex";
        divBotoes.style.gap = "3px";
        divBotoes.style.justifyContent = "center";
        divBotoes.style.alignItems = "center";
        const botaoEditar = document.createElement("button");
        botaoEditar.className = "action-button botao-editar";
        botaoEditar.innerHTML = `<i class="bi bi-pencil-square"></i>`;
        botaoEditar.addEventListener("click", () => abrirpopupEditarlocatario(locatario));
        const botaoDeletar = document.createElement("button");
        botaoDeletar.className = "action-button botao-deletar";
        botaoDeletar.innerHTML = `<i class="bi bi-trash-fill"></i>`;
        botaoDeletar.addEventListener("click", () => abrirpopupDeletarlocatarios(locatario));
        divBotoes.appendChild(botaoEditar);
        divBotoes.appendChild(botaoDeletar);
        acoesCell.appendChild(divBotoes);
    });
    renderPaginacao();
    aplicarRestricoesDeUsuario();
}
//---------------------------------------------------------------------------------
let blocoAtualLocatarios = 0; // controla o bloco atual de 3 páginas

function renderPaginacao() {
    const totalPaginas = Math.ceil(locatariosFiltrados.length / porPagina);
    const paginacaoDiv = document.getElementById("paginacao");
    paginacaoDiv.innerHTML = "";

    if (totalPaginas <= 1) return; // não mostra se só tem 1 página

    const paginasPorBloco = 3;
    const inicio = blocoAtualLocatarios * paginasPorBloco + 1;
    let fim = inicio + paginasPorBloco - 1;
    if (fim > totalPaginas) fim = totalPaginas;

    // Botão "Anterior"
    if (blocoAtualLocatarios > 0) {
        const btnAnterior = document.createElement("button");
        btnAnterior.textContent = "Anterior";
        btnAnterior.classList.add("page-btn");
        btnAnterior.addEventListener("click", () => {
            blocoAtualLocatarios--;
            paginaAtual = blocoAtualLocatarios * paginasPorBloco + 1;
            listarLocatarios();
            renderPaginacao();
        });
        paginacaoDiv.appendChild(btnAnterior);
    }

    // Páginas do bloco atual
    for (let i = inicio; i <= fim; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.classList.add("page-btn");
        if (i === paginaAtual) btn.classList.add("active");
        btn.addEventListener("click", () => {
            paginaAtual = i;
            listarLocatarios();
            renderPaginacao();
        });
        paginacaoDiv.appendChild(btn);
    }

    // Botão "Próximo"
    if (fim < totalPaginas) {
        const btnProximo = document.createElement("button");
        btnProximo.textContent = "Próximo";
        btnProximo.classList.add("page-btn");
        btnProximo.addEventListener("click", () => {
            blocoAtualLocatarios++;
            paginaAtual = blocoAtualLocatarios * paginasPorBloco + 1;
            listarLocatarios();
            renderPaginacao();
        });
        paginacaoDiv.appendChild(btnProximo);
    }
}

//-----------------------------------------------------------------------------
function pesquisarLocatarios() {
    const input = document.getElementById("searchbar").value.toLowerCase();
    locatariosFiltrados = locatarios.filter(l =>
        (l.name || "").toLowerCase().includes(input) ||
        (l.email || "").toLowerCase().includes(input) ||
        (l.telephone || "").toLowerCase().includes(input) ||
        (l.address || "").toLowerCase().includes(input) ||
        (l.cpf || "").toLowerCase().includes(input)
    );
    paginaAtual = 1;
    listarLocatarios();
    renderPaginacao();
}
    function abrirpopupCadastrarlocatarios(){
    document.getElementById('novoNomeLocatario').value = '';
    document.getElementById('novoEmailLocatario').value = '';
    document.getElementById('novoTelefoneLocatario').value = '';
    document.getElementById('novoEnderecoLocatario').value = '';
    document.getElementById('novoCPFLocatario').value = '';
    document.getElementById('popupCadastrarlocatarios').show();
}
function fecharpopupCadastrarlocatarios(){
    const popupCadastro = document.getElementById('popupCadastrarlocatarios');
    if (!popupCadastro || !popupCadastro.open) return;
    popupCadastro.classList.add('fechar-animado');
    popupCadastro.addEventListener('animationend', () => {
    popupCadastro.classList.remove('fechar-animado');
    popupCadastro.close();
    }, { once: true });
}

async function salvarNovoCadastro() {
    try {
        const nome = document.getElementById('novoNomeLocatario').value.trim();
        const email = document.getElementById('novoEmailLocatario').value.trim();
        let cpf = document.getElementById('novoCPFLocatario').value.trim();
        let telefone = document.getElementById('novoTelefoneLocatario').value.trim();
        const endereco = document.getElementById('novoEnderecoLocatario').value.trim();
        // 🔎 Limpar o CPF (remover pontos e traços, aceitar só números)
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11) {
            alert("CPF inválido. Digite exatamente 11 números.");
            return;
        }
        // 🔎 Limpar o telefone (apenas números)
        telefone = telefone.replace(/\D/g, '');
        if (telefone.length < 10 || telefone.length > 11) {
            alert("Telefone inválido. Digite com DDD (10 ou 11 dígitos).");
            return;
        }
        const novoLocatario = {
            name: nome,
            email: email,
            cpf: cpf,
            telephone: telefone,
            address: endereco
        };
        await axios.post(baseURLLocatarios, novoLocatario, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        alert("Locatário cadastrado com sucesso!");
        fecharpopupCadastrarlocatarios();
        carregarLocatarios();
        listarLocatarios();
    } catch (error) {
        console.error("Erro ao cadastrar Locatário:", error.response?.data || error.message);
        alert("Não foi possível cadastrar o Locatário.");
    }
}
function abrirpopupEditarlocatario(locatario, row) {
    document.getElementById('editNomeLocatario').value = locatario.name;
    document.getElementById('editEmailLocatario').value = locatario.email;
    document.getElementById('editTelefoneLocatario').value = locatario.telephone;
    document.getElementById('editEnderecoLocatario').value = locatario.address;
    document.getElementById('editCPFLocatario').value = locatario.cpf;

    editandoId = locatario.id;  

    document.getElementById('popupEditarlocatario').showModal();
}
function fecharpopupEditarlocatario() {
    const popupEditar = document.getElementById('popupEditarlocatario');
    if (!popupEditar || !popupEditar.open) return;
    popupEditar.classList.add('fechar-animado');
    popupEditar.addEventListener('animationend', () => {
    popupEditar.classList.remove('fechar-animado');
    popupEditar.close();
}, { once: true });
}

async function salvarEdicaoLocatario() {
    const name = document.getElementById('editNomeLocatario').value.trim();
    const email = document.getElementById('editEmailLocatario').value.trim();
    let telephone = document.getElementById('editTelefoneLocatario').value.trim();
    const address = document.getElementById('editEnderecoLocatario').value.trim();
    let cpf = document.getElementById('editCPFLocatario').value.trim();
    if (!name || !email || !address || !telephone || !cpf) {
        alert("Preencha todos os campos.");
        return;
    }
    // 🔎 Validação do CPF
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) {
        alert("CPF inválido. Digite exatamente 11 números.");
        return;
    }
    // 🔎 Validação do telefone
    telephone = telephone.replace(/\D/g, '');
    if (telephone.length < 10 || telephone.length > 11) {
        alert("Telefone inválido. Digite com DDD (10 ou 11 dígitos).");
        return;
    }
    const locatarioId = editandoId;
    if (!locatarioId) {
        alert("ID do locatário não encontrado.");
        return;
    }
    try {
        await axios.put(`${baseURLLocatarios}/${locatarioId}`, 
            { 
                name: name, 
                email: email, 
                telephone: telephone, 
                address: address, 
                cpf: cpf 
            }, 
            { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        alert("Locatário atualizado com sucesso!");
        fecharpopupEditarlocatario();
        carregarLocatarios();
        listarLocatarios();
    } catch (error) {
        console.error("Erro ao atualizar locatário:", error.response?.data || error.message);
        alert("Não foi possível atualizar o locatário.");
    }
}

function abrirpopupDeletarlocatarios(locatario, row) {
    document.getElementById('NomeLocatarioexcluido').textContent = locatario.name;
    document.getElementById('NomeLocatarioexcluidoIndex').value = locatario.id; // salva o ID
    document.getElementById('popupDeletarlocatario').showModal();
}
function fecharpopupDeletarlocatario() {
    const popupDeletar = document.getElementById('popupDeletarlocatario');
    if (!popupDeletar || !popupDeletar.open) return;
    popupDeletar.classList.add('fechar-animado');
    popupDeletar.addEventListener('animationend', () => {
    popupDeletar.classList.remove('fechar-animado');
    popupDeletar.close();
    }, { once: true });
}

async function confirmarExclusaoLocatario() {
    try {
        const locatarioId = document.getElementById('NomeLocatarioexcluidoIndex').value;
        if (!locatarioId) {
            alert("ID do locatário não encontrado.");
            return;
        }
        await axios.delete(`${baseURLLocatarios}/${locatarioId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Atualiza arrays e recarrega tabela
        locatarios = locatarios.filter(l => l.id !== locatarioId);
        locatariosFiltrados = locatariosFiltrados.filter(l => l.id !== locatarioId);
        carregarLocatarios();
        renderPaginacao();
        alert("Locatário excluído com sucesso!");
        fecharpopupDeletarlocatario();
    } catch (error) {
        console.error("Erro ao excluir locatário:", error.response?.data || error.message);
        alert("Não foi possível excluir o locatário.");
    }
}




const INPUT_BUSCA = document.getElementById('searchbar');
const CONTENT_TABLE = document.getElementById('content-table');
INPUT_BUSCA.addEventListener('keyup' , () => {
    let expressao = INPUT_BUSCA.value.toLowerCase();
    let linhas = CONTENT_TABLE.getElementsByTagName('tr');
    for(let posicao in linhas) {
        if( true === isNaN(posicao)){
            continue;
        }
        let conteudoDaLinha = linhas[posicao].innerHTML.toLowerCase();
        if(true === conteudoDaLinha.includes(expressao)){
            linhas[posicao].style.display = '';
        }
        else{
            linhas[posicao].style.display = 'none'
        }
    }
})