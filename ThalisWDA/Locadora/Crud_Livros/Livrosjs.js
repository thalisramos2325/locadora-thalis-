    const baseURLLivros = "https://locadora-ryan-back.altislabtech.com.br/book";
    const baseURLPublishers = "https://locadora-ryan-back.altislabtech.com.br/publisher";
    const token = localStorage.getItem("token");

    let editandoId = null; // guarda o ID que está sendo editado

    let livros = [];
    let livrosFiltrados = [];

    let editorasMap = {};
    let paginaAtual = 1;
    const porPagina = 8;

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

        livrosFiltrados.sort((a, b) => {
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
        listarLivros();
    }

    // Data -> dd/mm/yyyy
    function formatarData(data) {
    if (!data) return "";
    const d = new Date(data);
    if (isNaN(d)) return data; // se não for uma data válida, retorna original
    return d.toLocaleDateString("pt-BR");
    }

    function aplicarRestricoesDeUsuario() {
        const role = localStorage.getItem("role");

        if (role !== "ADMIN") {
            const botoesCadastrar = document.getElementsByClassName("butao-cadastro");
            for (let botao of botoesCadastrar) {
                botao.style.display = "none";
            }
            document.querySelectorAll(".botao-editar, .botao-deletar").forEach(btn => {
                btn.style.display = "none";
            });
            const tabela = document.getElementById("tabela-dados");
            if (tabela) {
                const thAcoes = tabela.querySelector("thead th:last-child");
                if (thAcoes) thAcoes.style.display = "none";
                tabela.querySelectorAll("tbody tr").forEach(tr => {
                    const td = tr.querySelector("td:last-child");
                    if (td) td.style.display = "none";
                });
            }
        }
    }

    let blocoAtualLivros = 0; // controla qual bloco de 3 páginas está sendo exibido

    function renderPaginacao() {
        const totalPaginas = Math.ceil(livrosFiltrados.length / porPagina);
        const paginacaoDiv = document.getElementById("paginacao");
        paginacaoDiv.innerHTML = "";

        if (totalPaginas <= 1) return; // não mostra paginação se só tem 1 página

        const paginasPorBloco = 3;
        const inicio = blocoAtualLivros * paginasPorBloco + 1;
        let fim = inicio + paginasPorBloco - 1;
        if (fim > totalPaginas) fim = totalPaginas;

        // Botão "Anterior"
        if (blocoAtualLivros > 0) {
            const btnAnterior = document.createElement("button");
            btnAnterior.textContent = "Anterior";
            btnAnterior.classList.add("page-btn");
            btnAnterior.addEventListener("click", () => {
                blocoAtualLivros--;
                paginaAtual = blocoAtualLivros * paginasPorBloco + 1;
                listarLivros();
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
                listarLivros();
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
                blocoAtualLivros++;
                paginaAtual = blocoAtualLivros * paginasPorBloco + 1;
                listarLivros();
                renderPaginacao();
            });
            paginacaoDiv.appendChild(btnProximo);
        }
    }

    //------------------------------------------------------------------------------------
    window.onload = carregarLivros;
    async function carregarLivros() {
    try {
        await carregarEditoras(); // precisa antes para mostrar nomes corretos
        const res = await axios.get(baseURLLivros, {
        headers: { Authorization: `Bearer ${token}` }
        });
        livros = res.data;
        livrosFiltrados = [...livros];
        paginaAtual = 1;
        listarLivros();
        renderPaginacao();
    } catch (err) {
        console.error("Erro ao buscar livros:", err);
    }
    }
    async function carregarEditoras() {
    try {
        const res = await axios.get(baseURLPublishers, {
        headers: { Authorization: `Bearer ${token}` }
        });
        res.data.forEach(pub => {
        editorasMap[pub.id] = pub.name;
        });
            // Popula select do cadastro
            const selectCadastro = document.getElementById('novoEditoraLivro');
            selectCadastro.innerHTML = ''; // limpa opções
            res.data.forEach(pub => {
                const option = document.createElement('option');
                option.value = pub.id;
                option.textContent = pub.name;
                selectCadastro.appendChild(option);
            });
            // Popula select da edição
            const selectEdicao = document.getElementById('editEditoraLivro');
            selectEdicao.innerHTML = '';
            res.data.forEach(pub => {
                const option = document.createElement('option');
                option.value = pub.id;
                option.textContent = pub.name;
                selectEdicao.appendChild(option);
            });
    } catch (err) {
        console.error("Erro ao carregar editoras:", err);
    }
    }
    // ================= LISTAR LIVROS =================
    function listarLivros() {
        const tabela = document.getElementById("tabela-dados").getElementsByTagName("tbody")[0];
        tabela.innerHTML = "";

        if (livrosFiltrados.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center; padding: 20px; font-weight: bold; color: #666;">
                    Nenhum Resultado Encontrado
                </td>
            </tr>
        `;
        return; // sai da função
    }

        const inicio = (paginaAtual - 1) * porPagina;
        const fim = inicio + porPagina;
        const livrosPagina = livrosFiltrados.slice(inicio, fim);

        livrosPagina.forEach(livro => {
            const row = tabela.insertRow();
            row.insertCell(0).textContent = livro.name;
            row.insertCell(1).textContent = livro.author;

            let publisherName = "Não informado";
            if (livro.publisher?.id) {
                publisherName = editorasMap[livro.publisher.id] || "Desconhecido";
            } else if (typeof livro.publisher === "number") {
                publisherName = editorasMap[livro.publisher] || "Desconhecido";
            }

            row.insertCell(2).textContent = publisherName;
            row.insertCell(3).textContent = new Date(livro.launchDate).toLocaleDateString();
            row.insertCell(4).textContent = livro.totalQuantity;

            const acoesCell = row.insertCell(5);
            const divBotoes = document.createElement("div");
            divBotoes.className = "acoes-container";
            divBotoes.style.display = "flex";
            divBotoes.style.gap = "3px";
            divBotoes.style.justifyContent = "center";
            divBotoes.style.alignItems = "center";

            const botaoEditar = document.createElement("button");
            botaoEditar.className = "action-button botao-editar";
            botaoEditar.innerHTML = `<i class="bi bi-pencil-square"></i>`;
            botaoEditar.addEventListener("click", () => abrirpopupEditarlivro(livro, row));

            const botaoDeletar = document.createElement("button");
            botaoDeletar.className = "action-button botao-deletar";
            botaoDeletar.innerHTML = `<i class="bi bi-trash-fill"></i>`;
            botaoDeletar.addEventListener("click", () => abrirpopupDeletarlivro(livro, row));

            divBotoes.appendChild(botaoEditar);
            divBotoes.appendChild(botaoDeletar);
            acoesCell.appendChild(divBotoes);
        });

        renderPaginacao(); // sempre refaz a paginação ao listar
        aplicarRestricoesDeUsuario();
    }

    function abrirpopupCadastrarlivro(){
        document.getElementById('novoNomeLivro').value = '';
        document.getElementById('novoAutorLivro').value = '';
        document.getElementById('novoEditoraLivro').value = '';
        document.getElementById('novoDataLancamento').value = '';
        document.getElementById('novoEstoque').value = '';
        document.getElementById('popupCadastrarlivro').show();
    }
    function fecharpopupCadastrarlivro(){
        const popupCadastro = document.getElementById('popupCadastrarlivro');
        if (!popupCadastro || !popupCadastro.open) return;
        popupCadastro.classList.add('fechar-animado');
        popupCadastro.addEventListener('animationend', () => {
        popupCadastro.classList.remove('fechar-animado');
        popupCadastro.close();
        }, { once: true });
    }

    async function salvarNovoCadastro() {
        const nome = document.getElementById("novoNomeLivro").value.trim();
        const autor = document.getElementById("novoAutorLivro").value.trim();
        const publisherId = document.getElementById("novoEditoraLivro").value.trim();
        const lancamento = document.getElementById("novoDataLancamento").value.trim();
        const estoque = parseInt(document.getElementById("novoEstoque").value.trim());
        if (!nome || !autor || !publisherId || !lancamento || isNaN(estoque)) {
            alert("Preencha todos os campos corretamente.");
            return;
        }
        try {
            await axios.post(baseURLLivros, {
                name: nome,
                author: autor,
                publisherId: publisherId,
                launchDate: lancamento,
                totalQuantity: estoque
            }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Livro cadastrado com sucesso!");
            carregarLivros();
            fecharpopupCadastrarlivro();
        } catch (err) {
            console.error("Erro ao cadastrar livro:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível cadastrar o livro. Tente novamente.");
        }
    }

    function abrirpopupEditarlivro(livro) {
        document.getElementById("editNomeLivro").value = livro.name;
        document.getElementById("editAutorLivro").value = livro.author;
        const selectEditora = document.getElementById("editEditoraLivro");
        if (livro.publisher?.id) {
            selectEditora.value = livro.publisher.id;
        } else if (typeof livro.publisher === "number") {
            selectEditora.value = livro.publisher;
        } else {
            selectEditora.value = '';
        }
        document.getElementById("editDataLancamento").value = livro.launchDate;
        document.getElementById("editEstoque").value = livro.totalQuantity;
        editandoId = livro.id;
        document.getElementById("popupEditarlivro").showModal();
    }
    function fecharpopupEditarlivro() {
        const popupEditar = document.getElementById('popupEditarlivro');
        if (!popupEditar || !popupEditar.open) return;
        popupEditar.classList.add('fechar-animado');
        popupEditar.addEventListener('animationend', () => {
        popupEditar.classList.remove('fechar-animado');
        popupEditar.close();
    }, { once: true });
    }

    async function salvarEdicaoLivro() {
        if (!editandoId) {
            alert("Nenhum livro selecionado para edição.");
            return;
        }
        const nome = document.getElementById("editNomeLivro").value.trim();
        const autor = document.getElementById("editAutorLivro").value.trim();
        const publisherId = document.getElementById("editEditoraLivro").value;
        const lancamento = document.getElementById("editDataLancamento").value;
        const estoque = parseInt(document.getElementById("editEstoque").value);
        if (!nome || !autor || !publisherId || !lancamento || isNaN(estoque)) {
            alert("Preencha todos os campos corretamente.");
            return;
        }
        try {
            await axios.put(`${baseURLLivros}/${editandoId}`, {
                name: nome,
                author: autor,
                publisherId: publisherId,
                launchDate: lancamento,
                totalQuantity: estoque
            }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Livro atualizado com sucesso!");
            carregarLivros();
            fecharpopupEditarlivro();
        } catch (err) {
            console.error("Erro ao editar livro:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível editar o livro. Tente novamente.");
        }
    }
    function abrirpopupDeletarlivro(livro, row) {
        document.getElementById("Nomelivroexcluido").textContent = livro.name;
        // pega o índice do livro no array filtrado (índice real, não da página)
        const indexGlobal = livrosFiltrados.findIndex(l => l.id === livro.id);
        document.getElementById("NomelivroexcluidoIndex").value = indexGlobal;

        document.getElementById("popupDeletarlivro").showModal();
    }
    function fecharpopupDeletarlivro() {
        const popupDeletar = document.getElementById('popupDeletarlivro');
        if (!popupDeletar || !popupDeletar.open) return;
        popupDeletar.classList.add('fechar-animado');
        popupDeletar.addEventListener('animationend', () => {
        popupDeletar.classList.remove('fechar-animado');
        popupDeletar.close();
        }, { once: true });
    }
    async function confirmarExclusaoLivro() {
        try {
            const idLivro = document.getElementById('NomelivroexcluidoIndex').value;
            const livro = livrosFiltrados.find(l => l.id == idLivro);

            if (!livro) {
                alert("Não foi possível identificar o livro para exclusão.");
                return;
            }

            if (livro.totalQuantity === 0) {
                alert("Não é possível excluir este livro, pois há exemplares alugados.");
                fecharpopupDeletarlivro();
                return;
            }

            await axios.delete(`${baseURLLivros}/${livro.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            livros = livros.filter(l => l.id !== livro.id);
            livrosFiltrados = livrosFiltrados.filter(l => l.id !== livro.id);

            alert("Livro excluído com sucesso!");
            fecharpopupDeletarlivro();

            listarLivros(); // atualiza tabela com paginação
        } catch (error) {
            console.error("Erro ao deletar livro:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível deletar o livro. Tente novamente.");
        }
    }

function pesquisarLivros() {
    const input = document.getElementById("searchbar").value.toLowerCase();
    livrosFiltrados = livros.filter(l =>
        (l.name || "").toLowerCase().includes(input) ||
        (l.author || "").toLowerCase().includes(input) ||
        (l.publisher?.name || "").toLowerCase().includes(input) ||
        (l.launchDate || "").toLowerCase().includes(input) ||
        (l.totalQuantity?.toString() || "").toLowerCase().includes(input)
    );
    paginaAtual = 1;
    listarLivros();
    renderPaginacao();
}
document.getElementById("searchbar").addEventListener("keyup", pesquisarLivros);


    // ---------------- utilitário para pegar o email do usuário do localStorage ou do token ----------------
    function getUserEmailFromStorageOrToken() {
    // tenta chaves comuns
    const possibleKeys = [
        "email", "userEmail", "usuarioEmail", "username", "usuarioNome", "user", "user_info"
    ];

    for (const key of possibleKeys) {
        const val = localStorage.getItem(key);
        if (val) return val;
    }

    // tenta extrair do token JWT (se houver)
    const token = localStorage.getItem("token");
    if (token) {
        try {
        const payloadBase64 = token.split(".")[1];
        if (payloadBase64) {
            // corrigir base64 URL-safe
            const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
            const json = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(json);
            if (payload.email) return payload.email;
            if (payload.username) return payload.username;
            if (payload.sub) return payload.sub;
        }
        } catch (e) {
        // se falhar, ignoramos e retornamos null
        console.warn("Não foi possível decodificar token para email:", e);
        }
    }

    return null;
    }

    // ---------------- Abrir popup de sair (usa mesma aparência dos popups existentes) ----------------
    function abrirPopupSair() {
    const popup = document.getElementById("popupDeSair");
    if (!popup) return;

    const email = getUserEmailFromStorageOrToken() || "Usuário";
    const el = document.getElementById("usuarioEmail");
    if (el) el.textContent = email;

    // mostra como seus outros popups (showModal para dialog)
    if (typeof popup.showModal === "function") {
        popup.showModal();
    } else {
        popup.setAttribute("open", "");
    }
    }


    function fecharPopupSair() {
    const popup = document.getElementById("popupDeSair");
    if (!popup) return;

    // se não tiver animação, só fecha
    if (!popup.classList.contains("fechar-animado")) {
        popup.close();
        return;
    }

    // se você tiver animação CSS configurada
    popup.classList.add("fechar-animado");
    popup.addEventListener(
        "animationend",
        () => {
        popup.classList.remove("fechar-animado");
        popup.close();
        },
        { once: true }
    );
    }

    // ---------------- confirmar saída ----------------
    function confirmarSaida() {
    // remove itens sensíveis (mantive um remove amplo, você pode adaptar)
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    // remova também chaves que você usa (se existirem)
    localStorage.removeItem("email");
    localStorage.removeItem("username");
    localStorage.removeItem("usuarioNome");
    localStorage.removeItem("userEmail");

    // redireciona para a sua página de login
    window.location.href = "/Locadora/Login/Login.html";
    }