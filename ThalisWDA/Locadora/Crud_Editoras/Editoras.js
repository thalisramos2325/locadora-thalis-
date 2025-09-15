    let editoras = [];          
    let editorasFiltrados = []; 
    const baseURL = "https://locadora-ryan-back.altislabtech.com.br/publisher";
    const token = localStorage.getItem("token");

    let paginaAtual = 1;
    const porPagina = 8;

    let editandoId = null; // guarda o ID que está sendo editado
    let blocoAtualEditoras = 0; 

    let ordenacaoAtual = {
        coluna: null, // 'name', 'email', 'telephone', 'site'
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

        editorasFiltrados.sort((a, b) => {
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
        listarEditoras();
    }

    function formatarTelefone(telefone) {
    if (!telefone) return "";
    telefone = telefone.replace(/\D/g, "");
    if (telefone.length === 11) {
        return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (telefone.length === 10) {
        return telefone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return telefone; 
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

    function renderPaginacao() {
        const totalPaginas = Math.ceil(editorasFiltrados.length / porPagina);
        const paginacaoDiv = document.getElementById("paginacao");
        paginacaoDiv.innerHTML = "";

        if (totalPaginas <= 1) return; // não renderiza se só tem 1 página

        const paginasPorBloco = 3;
        const inicio = blocoAtualEditoras * paginasPorBloco + 1;
        let fim = inicio + paginasPorBloco - 1;
        if (fim > totalPaginas) fim = totalPaginas;

        // Botão "Anterior" (bloco anterior)
        if (blocoAtualEditoras > 0) {
            const btnAnterior = document.createElement("button");
            btnAnterior.textContent = "Anterior";
            btnAnterior.classList.add("page-btn");
            btnAnterior.addEventListener("click", () => {
                blocoAtualEditoras--;
                paginaAtual = blocoAtualEditoras * paginasPorBloco + 1;
                listarEditoras();
                renderPaginacao();
            });
            paginacaoDiv.appendChild(btnAnterior);
        }

        // Números do bloco atual
        for (let i = inicio; i <= fim; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            btn.classList.add("page-btn");
            if (i === paginaAtual) btn.classList.add("active");
            btn.addEventListener("click", () => {
                paginaAtual = i;
                listarEditoras();
                renderPaginacao();
            });
            paginacaoDiv.appendChild(btn);
        }

        // Botão "Próximo" (próximo bloco)
        if (fim < totalPaginas) {
            const btnProximo = document.createElement("button");
            btnProximo.textContent = "Próximo";
            btnProximo.classList.add("page-btn");
            btnProximo.addEventListener("click", () => {
                blocoAtualEditoras++;
                paginaAtual = blocoAtualEditoras * paginasPorBloco + 1;
                listarEditoras();
                renderPaginacao();
            });
            paginacaoDiv.appendChild(btnProximo);
        }
    }


    // ----------------------------CARREGANDO AS EDITORAS------------------------------------
    window.onload = carregarEditoras;

    function carregarEditoras() {
        axios.get(baseURL, { headers: { Authorization: "Bearer " + token } })
            .then(res => {
                editoras = res.data;
                editorasFiltrados = [...editoras]; // inicialmente todos
                paginaAtual = 1;
                listarEditoras();
            })
            .catch(error => console.error("Erro ao buscar editoras:", error));
    }

    // LISTAR EDITORAS (usa lista já carregada ou filtrada)
    function listarEditoras() {
        const tabela = document.getElementById('tabela-dados').getElementsByTagName('tbody')[0];
        tabela.innerHTML = ""; // limpa tabela antes de preencher

        if (editorasFiltrados.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center; padding: 20px; font-weight: bold; color: #666;">
                    Nenhum Resultado Encontrado
                </td>
            </tr>
        `;
        return; // sai da função
    }

        // calcular os limites da página
        const inicio = (paginaAtual - 1) * porPagina;
        const fim = inicio + porPagina;

        // fatia a lista só para a página atual
        const editorasPagina = editorasFiltrados.slice(inicio, fim);

        editorasPagina.forEach((editora, index) => {
            const row = tabela.insertRow();
            row.insertCell(0).textContent = editora.name;
            row.insertCell(1).textContent = editora.email;
            row.insertCell(2).textContent = formatarTelefone(editora.telephone);
            row.insertCell(3).textContent = editora.site;

            const acoesCell = row.insertCell(4);
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
            botaoEditar.addEventListener("click", () => {
                abrirpopupEditareditora(editora, row);
            });

            // Botão Deletar
            const botaoDeletar = document.createElement("button");
            botaoDeletar.className = "action-button botao-deletar";
            botaoDeletar.innerHTML = `<i class="bi bi-trash-fill"></i>`;
            botaoDeletar.addEventListener("click", () => {
                abrirpopupDeletareditora(editora, row);
            });

            divBotoes.appendChild(botaoEditar);
            divBotoes.appendChild(botaoDeletar);
            acoesCell.appendChild(divBotoes);
        });

        // ⚡ atualizar paginação sempre que listar
        renderPaginacao();
        aplicarRestricoesDeUsuario();
    }
    //---------------------------ADICIONAR-----------------------------------------
    function abrirpopupCadastrareditoras(){
        document.getElementById('novoNomeEditora').value = '';
        document.getElementById('novoEmailEditora').value = '';
        document.getElementById('novoTelefoneEditora').value = '';
        document.getElementById('novoSiteEditora').value = '';
        document.getElementById('popupCadastrareditoras').show();
    }
    function fecharpopupCadastrareditoras() {
        const popupCadastro = document.getElementById('popupCadastrareditoras');
        if (!popupCadastro || !popupCadastro.open) return;
        popupCadastro.classList.add('fechar-animado');
        popupCadastro.addEventListener('animationend', () => {
            popupCadastro.classList.remove('fechar-animado');
            popupCadastro.close();
        }, { once: true });
    }
    async function salvarNovoCadastro() {
        const novaEditora = {
            name: document.getElementById('novoNomeEditora').value.trim(),
            email: document.getElementById('novoEmailEditora').value.trim(),
            telephone: document.getElementById('novoTelefoneEditora').value.trim(),
            site: document.getElementById('novoSiteEditora').value.trim() || "",
        };
        // Validação dos campos
        if (!novaEditora.name || !novaEditora.email || !novaEditora.telephone) {
            alert("Preencha todos os campos corretamente.");
            return;
        }
        try {
        // const response = 
            await axios.post(baseURL, novaEditora, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            alert("Editora cadastrada com sucesso!");
            // location.reload();
            carregarEditoras();
            renderPaginacao();
            fecharpopupCadastrareditoras();
        } catch (error) {
            console.error("Erro ao cadastrar editora:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível cadastrar a editora. Tente novamente.");
        }
    }
    // ----------------------------------EDITAR-----------------------------------------------------
    function abrirpopupEditareditora(editora) {
        editandoId = editora.id; // salva o ID globalmente
        document.getElementById('editNomeEditora').value = editora.name;
        document.getElementById('editEmailEditora').value = editora.email;
        document.getElementById('editTelefoneEditora').value = editora.telephone;
        document.getElementById('editSiteEditora').value = editora.site;
        document.getElementById('popupEditareditora').showModal();
    }
    function fecharpopupEditareditora() {
        const popupEditar = document.getElementById('popupEditareditora');
        if (!popupEditar || !popupEditar.open) return;
        popupEditar.classList.add('fechar-animado');
        popupEditar.addEventListener('animationend', () => {
        popupEditar.classList.remove('fechar-animado');
        popupEditar.close();
        }, { once: true });
    }
    async function salvarEdicaoEditora() {
        const nome = document.getElementById('editNomeEditora').value.trim();
        const email = document.getElementById('editEmailEditora').value.trim();
        const telefone = document.getElementById('editTelefoneEditora').value.trim();
        const site = document.getElementById('editSiteEditora').value.trim() || '';
        if (!nome || !email || !telefone ) {
            alert("Preencha todos os campos corretamente.");
            return;
        }
        const editoraId = editandoId;
        if (!editoraId) {
            alert("ID da editora não encontrado.");
            return;
        }
        try {
            await axios.put(`${baseURL}/${editoraId}`, 
                { name: nome, email: email, telephone: telefone, site: site }, 
                { headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }}
            );
            alert("Editora atualizada com sucesso!");
            fecharpopupEditareditora();
            carregarEditoras();
            listarEditoras();
        } catch (error) {
            console.error("Erro ao editar editora:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível editar a editora. Tente novamente.");
        }
    }
    // -------------------------------------DELETAR---------------------------------------------------------------
    function abrirpopupDeletareditora(editora, row) {
        const rowIndex = row.rowIndex - 1; // Corrige o rowIndex
        const novoNomeEditora = row.cells[0].textContent; // ou 0, depende da coluna do nome
        document.getElementById('NomeEditoraexcluida').value = rowIndex;
        document.getElementById('NomeEditoraexcluida').textContent = novoNomeEditora;
        document.getElementById('popupDeletareditora').showModal();
    }
    function fecharpopupDeletarEditora() {
        const popupDeletar = document.getElementById('popupDeletareditora');
        if (!popupDeletar || !popupDeletar.open) return;
        popupDeletar.classList.add('fechar-animado');
        popupDeletar.addEventListener('animationend', () => {
            popupDeletar.classList.remove('fechar-animado');
            popupDeletar.close();
        }, { once: true });
    }
    async function confirmarExclusaoEditora() {
    try {
            const rowIndex = parseInt(document.getElementById('NomeEditoraexcluida').value);
            const tabela = document.getElementById('tabela-dados').getElementsByTagName('tbody')[0];
            const row = tabela.rows[rowIndex];
            const editora = editorasFiltrados[rowIndex];
            if (!editora || !editora.id) {
                alert("Não foi possível identificar a editora para exclusão.");
                return;
            }
            await axios.delete(`${baseURL}/${editora.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            tabela.deleteRow(rowIndex);
            alert("Editora excluída com sucesso!");
            fecharpopupDeletarEditora();
            editoras = editoras.filter(e => e.id !== editora.id);
            editorasFiltrados = editorasFiltrados.filter(e => e.id !== editora.id);
            renderPaginacao();
            carregarEditoras();
        } catch (error) {
            console.error("Erro ao deletar editora:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível deletar a editora. Tente novamente.");
        }
    }

    function pesquisarEditorasGrid() {
        const input = document.getElementById('searchbar').value.toLowerCase();

        editorasFiltrados = editoras.filter(editora =>
            (editora.name || "").toLowerCase().includes(input) ||
            (editora.email || "").toLowerCase().includes(input) ||
            (editora.telephone?.toString() || "").toLowerCase().includes(input) ||
            (editora.site || "").toLowerCase().includes(input)
        );

        paginaAtual = 1; // sempre volta para a primeira página
        listarEditoras();
    }

    const menu = document.querySelector('.Menu-Lateral');
    menu.addEventListener('click', () => {
        menu.classList.toggle('ativo');
    });



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