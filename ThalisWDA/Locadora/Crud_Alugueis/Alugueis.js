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

    // Data -> dd/mm/yyyy
    function formatarData(data) {
    if (!data) return "";
    const d = new Date(data);
    if (isNaN(d)) return data; // se não for uma data válida, retorna original
    return d.toLocaleDateString("pt-BR");
    }

    function traduzirStatus(status) {
    if (!status) return "";
    const mapa = {
        
        "RENTED": "Alugado",
        "DELIVERED_WITH_DELAY": "Entregue com atraso",
        "IN_TIME": "No Prazo",
        "LATE": "Atrasado"
    };
    return mapa[status] || status; // se não estiver no mapa, mostra original
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
        } catch (error) {
            console.error("Erro ao buscar aluguéis:", error);
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

        } catch (error) {
            console.error("Erro ao carregar livros:", error);
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

        } catch (error) {
            console.error("Erro ao carregar locatários:", error);
        }
    }
    // ------------------------- LISTAR -------------------------
    function listarAlugueis() {
        const tabela = document.getElementById("tabela-dados").getElementsByTagName("tbody")[0];
        tabela.innerHTML = "";

        if (alugueisFiltrados.length === 0) {
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
        const pagina = alugueisFiltrados.slice(inicio, fim);

        pagina.forEach(aluguel => {
            const row = tabela.insertRow();

            const nomeLivro = aluguel.book?.name || "—";
            const nomeRenter = aluguel.renter?.name || "—";

            row.insertCell(0).textContent = nomeLivro;
            row.insertCell(1).textContent = nomeRenter;
            row.insertCell(2).textContent = formatarData(aluguel.deadLine);
            row.insertCell(3).textContent = formatarData(aluguel.devolutionDate);
            row.insertCell(4).textContent = formatarData(aluguel.rentDate);
            row.insertCell(5).textContent = traduzirStatus(aluguel.status);

    const acoesCell = row.insertCell(6);

    // Só mostra botões se aluguel ainda não estiver finalizado
    if (aluguel.status === "RENTED") {
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

        // Botão Finalizar
        const botaoFinalizar = document.createElement("button");
        botaoFinalizar.className = "action-button botao-deletar";
        botaoFinalizar.innerHTML = `<i class="bi bi-check-square"></i>`;
        botaoFinalizar.addEventListener("click", () => confirmarExclusaoAluguel(aluguel));

        divBotoes.appendChild(botaoEditar);
        divBotoes.appendChild(botaoFinalizar);
        acoesCell.appendChild(divBotoes);
    } else {
        // Caso finalizado, mostra apenas um tracinho
        acoesCell.textContent = "Finalizado";
        acoesCell.style.textAlign = "center";
        acoesCell.style.color = "#999";
    }});

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

        // Data de hoje (apenas YYYY-MM-DD)
        const hoje = new Date();
        const hojeStr = hoje.toLocaleDateString("en-CA"); // "YYYY-MM-DD"

        // Calcular data de devolução adicionando o prazo (em dias)
        const returnDate = new Date();
        returnDate.setDate(hoje.getDate() + parseInt(prazo));
        try {
            await axios.post(baseURLAlugueis, {
                bookId: livroId,
                renterId: locatarioId,
                rentDate: hojeStr,       // data de hoje em ISO
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
        } catch (error) {
            console.error("Erro ao cadastrar aluguel:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível cadastrar o aluguel. Tente novamente.");
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
            console.error("Erro ao editar aluguel:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível editar o aluguel. Tente novamente.");
        }
    }

    async function confirmarExclusaoAluguel(aluguel) {
        if (!aluguel || !aluguel.id) {
            alert("Aluguel não encontrado para finalizar.");
            return;
        }

        try {
            // pega data atual no formato YYYY-MM-DD no fuso local
            const hoje = new Date().toLocaleDateString("en-CA");

            await axios.put(`${baseURLAlugueis}/${aluguel.id}`, {
                devolutionDate: hoje // apenas finaliza
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Aluguel finalizado com sucesso!");
            carregarAlugueis(); // atualiza tabela
            listarAlugueis();
        } catch (error) {
            console.error("Erro ao Finalizar aluguel:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível Finalizar o aluguel. Tente novamente.");
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