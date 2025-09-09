let alugueis = [];
let alugueisFiltrados = [];
let livros = [];
let locatarios = [];
let paginaAtual = 1;
const porPagina = 8;

const baseURLLivros = "https://locadora-ryan-back.altislabtech.com.br/book";
const baseURLLocatarios = "https://locadora-ryan-back.altislabtech.com.br/renter";
const baseURLAlugueis = "https://locadora-ryan-back.altislabtech.com.br/rent";
const token = localStorage.getItem("token");

let editandoId = null;

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

    alugueisFiltrados.sort((a, b) => {
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
    listarAlugueis();
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
// ------------------------- CARREGAR ALUGUÉIS -------------------------
window.addEventListener("DOMContentLoaded", carregarAlugueis);
window.addEventListener("DOMContentLoaded", async () => {
    await carregarLivros();
    await carregarLocatarios();
});

async function carregarAlugueis() {
    try {
        const res = await axios.get(baseURLAlugueis, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alugueis = res.data;
        alugueisFiltrados = [...alugueis];
        paginaAtual = 1;
        listarAlugueis();
        renderPaginacao();
    } catch (err) {
        console.error("Erro ao buscar aluguéis:", err);
    }
}
async function carregarLivros() {
    try {
        const res = await axios.get(baseURLLivros, {
            headers: { Authorization: `Bearer ${token}` }
        });
        livros = res.data;
        // Popula select de cadastro
        const selectLivro = document.getElementById('novoNomeLivro');
        selectLivro.innerHTML = "";
        livros.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.textContent = l.name;
            selectLivro.appendChild(opt);
        });
        // Popula select da edição
        const selectLivroEdit = document.getElementById('editNomeLivro');
        selectLivroEdit.innerHTML = "";
        livros.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.textContent = l.name;
            selectLivroEdit.appendChild(opt);
        });

    } catch (err) {
        console.error("Erro ao carregar livros:", err);
    }
}
async function carregarLocatarios() {
    try {
        const res = await axios.get(baseURLLocatarios, {
            headers: { Authorization: `Bearer ${token}` }
        });
        locatarios = res.data;

        // Popula select de cadastro
        const selectRenter = document.getElementById('novoNomeLocatario');
        selectRenter.innerHTML = "";
        locatarios.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = r.name;
            selectRenter.appendChild(opt);
        });

        // Popula select da edição
        const selectRenterEdit = document.getElementById('editNomeLocatario');
        selectRenterEdit.innerHTML = "";
        locatarios.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = r.name;
            selectRenterEdit.appendChild(opt);
        });

    } catch (err) {
        console.error("Erro ao carregar locatários:", err);
    }
}
// ------------------------- LISTAR -------------------------
function listarAlugueis() {
    const tabela = document.getElementById("tabela-dados").getElementsByTagName("tbody")[0];
    tabela.innerHTML = "";

    const inicio = (paginaAtual - 1) * porPagina;
    const fim = inicio + porPagina;
    const pagina = alugueisFiltrados.slice(inicio, fim);

    pagina.forEach(aluguel => {
        const row = tabela.insertRow();

        const nomeLivro = aluguel.book?.name || "—";
        const nomeRenter = aluguel.renter?.name || "—";

        row.insertCell(0).textContent = aluguel.id;
        row.insertCell(1).textContent = nomeLivro;
        row.insertCell(2).textContent = nomeRenter;
        row.insertCell(3).textContent = aluguel.deadLine;
        row.insertCell(4).textContent = aluguel.devolutionDate;
        row.insertCell(5).textContent = aluguel.rentDate;
        row.insertCell(6).textContent = aluguel.status;

        const acoesCell = row.insertCell(7);
        const divBotoes = document.createElement("div");
        divBotoes.className = "acoes-container";
        divBotoes.style.display = "flex";
        divBotoes.style.gap = "3px";
        divBotoes.style.justifyContent = "center";
        divBotoes.style.alignItems = "center";

        // Botão Editar
        const botaoEditar = document.createElement("button");
        botaoEditar.className = "action-button botao-editar";
        botaoEditar.innerHTML = `<i class="bi bi-pencil-square"></i>`;
        botaoEditar.addEventListener("click", () => abrirpopupEditaraluguel(aluguel));
        
        // Botão Deletar
        const botaoDeletar = document.createElement("button");
        botaoDeletar.className = "action-button botao-deletar";
        botaoDeletar.innerHTML = `<i class="bi bi-trash-fill"></i>`;
        botaoDeletar.addEventListener("click", () => confirmarExclusaoAluguel(aluguel));

        divBotoes.appendChild(botaoEditar);
        divBotoes.appendChild(botaoDeletar);
        acoesCell.appendChild(divBotoes);
    });

    renderPaginacao();
    aplicarRestricoesDeUsuario();
}
// ------------------------- PAGINAÇÃO -------------------------
let blocoAtual = 0; // controla qual "bloco" de 3 está sendo exibido

function renderPaginacao() {
    const totalPaginas = Math.ceil(alugueisFiltrados.length / porPagina);
    const paginacaoDiv = document.getElementById("paginacao");
    paginacaoDiv.innerHTML = "";

    const paginasPorBloco = 3;
    const inicio = blocoAtual * paginasPorBloco + 1;
    let fim = inicio + paginasPorBloco - 1;
    if (fim > totalPaginas) fim = totalPaginas;

    // Botão "Anterior" (bloco anterior)
    if (blocoAtual > 0) {
        const btnAnterior = document.createElement("button");
        btnAnterior.textContent = "Anterior";
        btnAnterior.className = "page-btn";
        btnAnterior.addEventListener("click", () => {
            blocoAtual--;
            paginaAtual = blocoAtual * paginasPorBloco + 1;
            listarAlugueis();
            renderPaginacao();
        });
        paginacaoDiv.appendChild(btnAnterior);
    }

    // Números dentro do bloco atual
    for (let i = inicio; i <= fim; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = "page-btn";
        if (i === paginaAtual) btn.classList.add("active");
        btn.addEventListener("click", () => {
            paginaAtual = i;
            listarAlugueis();
            renderPaginacao();
        });
        paginacaoDiv.appendChild(btn);
    }

    // Botão "Próximo" (próximo bloco)
    if (fim < totalPaginas) {
        const btnProximo = document.createElement("button");
        btnProximo.textContent = "Próximo";
        btnProximo.className = "page-btn";
        btnProximo.addEventListener("click", () => {
            blocoAtual++;
            paginaAtual = blocoAtual * paginasPorBloco + 1;
            listarAlugueis();
            renderPaginacao();
        });
        paginacaoDiv.appendChild(btnProximo);
    }
}
async function abrirpopupCadastraraluguel(){
    document.getElementById('novoNomeLivro').value = '';
    document.getElementById('novoNomeLocatario').value = '';
    document.getElementById('novaDataPrazo').value = '';
    // document.getElementById('novaDataDevolucao').value = '';
    // document.getElementById('novaDataLocacao').value = '';
    // document.getElementById('novaStatusAluguel').value = '';

    // await carregarLivros();
    // await carregarLocatarios();

    document.getElementById('popupCadastrarAluguel').showModal();
}
function fecharpopupCadastraraluguel(){
    const popupCadastro = document.getElementById('popupCadastrarAluguel');
    if (!popupCadastro) return;
    popupCadastro.classList.add('fechar-animado');
    popupCadastro.addEventListener('animationend', () => {
        popupCadastro.classList.remove('fechar-animado');
        if (typeof popupCadastro.close === "function") {
            popupCadastro.close(); 
        }
    }, { once: true });
}
async function salvarNovoAluguel() {
    const livroId = document.getElementById("novoNomeLivro").value;
    const locatarioId = document.getElementById("novoNomeLocatario").value;
    const prazo = document.getElementById("novaDataPrazo").value; 

    const hoje = new Date();

    // Calcular data de devolução adicionando o prazo (em dias)
    const returnDate = new Date();
    returnDate.setDate(hoje.getDate() + parseInt(prazo));
    try {
        await axios.post(baseURLAlugueis, {
            bookId: livroId,
            renterId: locatarioId,
            rentDate: hoje.toISOString(),       // data de hoje em ISO
            deadLine: prazo                // data final escolhida
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        alert("Aluguel cadastrado com sucesso!");
        carregarAlugueis();
        fecharpopupCadastraraluguel();
    } catch (err) {
        console.error("Erro ao cadastrar aluguel:", err.response?.data || err.message);
        alert("Erro ao cadastrar aluguel!");
    }
}
async function abrirpopupEditaraluguel(aluguel, row) {
    editandoId = aluguel.id;
    document.getElementById('editNomeLivro').value = aluguel.book?.id || '';
    document.getElementById('editNomeLocatario').value = aluguel.renter?.id || '';
    document.getElementById('editDataPrazo').value = aluguel.deadLine || '';
    // await carregarLivros();
    // await carregarLocatarios();

    document.getElementById('popupEditarAluguel').showModal();
}
function fecharpopupEditaraluguel() {
    const popupEditar = document.getElementById('popupEditarAluguel');
    if (!popupEditar || !popupEditar.open) return;
    popupEditar.classList.add('fechar-animado');
    popupEditar.addEventListener('animationend', () => {
    popupEditar.classList.remove('fechar-animado');
    popupEditar.close();
}, { once: true });
}
async function salvarEdicaoaluguel() {
 if (!editandoId) {
        alert("ID do aluguel não encontrado.");
        return;
    }

    const aluguelAtualizado = {
        renterId: document.getElementById('editNomeLocatario').value,
        bookId: document.getElementById('editNomeLivro').value,
        deadLine: document.getElementById('editDataPrazo').value,
        devolutionDate: document.getElementById('editDataDevolucao').value || null
    };

    try {
        await axios.put(`${baseURLAlugueis}/${editandoId}`, aluguelAtualizado, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Aluguel atualizado com sucesso!");
        fecharpopupEditaraluguel();
        carregarAlugueis();
    } catch (error) {
        console.error("Erro ao atualizar aluguel:", error.response?.data || error.message);
        alert("Não foi possível atualizar o aluguel.");
    }
}

async function confirmarExclusaoAluguel(aluguel) {
    if (!aluguel || !aluguel.id) {
        alert("Aluguel não encontrado para finalizar.");
        return;
    }

    try {
        const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        await axios.put(`${baseURLAlugueis}/${aluguel.id}`, {
            devolutionDate: hoje // apenas finaliza
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert("Aluguel finalizado com sucesso!");
        carregarAlugueis(); // atualiza tabela
        listarAlugueis();
    } catch (error) {
        console.error("Erro ao finalizar aluguel:", error.response?.data || error.message);
        alert("Não foi possível finalizar o aluguel.");
    }
}
// ------------------------- BUSCA -------------------------
function pesquisarAlugueis() {
    const input = document.getElementById("searchbar").value.toLowerCase();
    alugueisFiltrados = alugueis.filter(a =>
        (a.book?.name || "").toLowerCase().includes(input) ||
        (a.renter?.name || "").toLowerCase().includes(input) ||
        (a.deadLine || "").toLowerCase().includes(input) ||
        (a.devolutionDate || "").toLowerCase().includes(input) ||
        (a.rentDate || "").toLowerCase().includes(input) ||
        (a.status || "").toLowerCase().includes(input)
    );
    paginaAtual = 1;
    listarAlugueis();
    renderPaginacao();
}
document.getElementById("searchbar").addEventListener("keyup", pesquisarAlugueis);