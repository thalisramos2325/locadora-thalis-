    let usuarios = [];
    let usuariosFiltrados = [];

    let paginaAtual = 1;
    const porPagina = 8;

    const baseURL = "https://locadora-ryan-back.altislabtech.com.br/user";
    const token = localStorage.getItem('token');

    let editandoId = null;
    let ordenacaoAtual = {
        coluna: null,
        crescente: true
    };
    function ordenarTabelaPor(coluna) {
        if (ordenacaoAtual.coluna === coluna) {

            ordenacaoAtual.crescente = !ordenacaoAtual.crescente;
        } else {
            ordenacaoAtual.coluna = coluna;
            ordenacaoAtual.crescente = true;
        }

        usuariosFiltrados.sort((a, b) => {
            let valA = a[coluna] || "";
            let valB = b[coluna] || "";


            valA = valA.toString().toLowerCase();
            valB = valB.toString().toLowerCase();

            if (valA < valB) return ordenacaoAtual.crescente ? -1 : 1;
            if (valA > valB) return ordenacaoAtual.crescente ? 1 : -1;
            return 0;
        });

        paginaAtual = 1; 
        listarUsuarios();
    }

    function traduzirRole(role) {
    if (!role) return "";
    const mapa = {
        "ADMIN": "EDITOR",
        "USER": "LEITOR",
    };
        return mapa[role] || role; // se não estiver no mapa, mostra original
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

    let blocoAtual = 0; 

    function renderPaginacao() {
        const totalPaginas = Math.ceil(usuariosFiltrados.length / porPagina);
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
            btnAnterior.classList.add("page-btn");
            btnAnterior.addEventListener("click", () => {
                blocoAtual--;
                paginaAtual = blocoAtual * paginasPorBloco + 1;
                listarUsuarios();
                renderPaginacao();
            });
            paginacaoDiv.appendChild(btnAnterior);
        }


        for (let i = inicio; i <= fim; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            btn.classList.add("page-btn");
            if (i === paginaAtual) btn.classList.add("active");
            btn.addEventListener("click", () => {
                paginaAtual = i;
                listarUsuarios();
                renderPaginacao();
            });
            paginacaoDiv.appendChild(btn);
        }


        if (fim < totalPaginas) {
            const btnProximo = document.createElement("button");
            btnProximo.textContent = "Próximo";
            btnProximo.classList.add("page-btn");
            btnProximo.addEventListener("click", () => {
                blocoAtual++;
                paginaAtual = blocoAtual * paginasPorBloco + 1;
                listarUsuarios();
                renderPaginacao();
            });
            paginacaoDiv.appendChild(btnProximo);
        }
    }
    window.onload = carregarUsuarios();
    async function carregarUsuarios() {
    try {
        const res = await axios.get(baseURL, { 
        headers: { Authorization: "Bearer " + token } 
        });
        usuarios = res.data;
        usuariosFiltrados = [...usuarios]; // inicia com todos
        paginaAtual = 1;
        listarUsuarios();
        renderPaginacao();
    } catch (err) {
        console.error("Erro ao buscar usuários:", err);
    }
    }
    // ------------------------------------------------------------------- 
    document.addEventListener('DOMContentLoaded', listarUsuarios)
    function listarUsuarios() {
    const tabela = document.getElementById('tabela-dados').getElementsByTagName('tbody')[0];
    tabela.innerHTML = ""; 


    const inicio = (paginaAtual - 1) * porPagina;
    const fim = inicio + porPagina;
    const paginaUsuarios = usuariosFiltrados.slice(inicio, fim);


    paginaUsuarios.forEach(usuario => {
        const row = tabela.insertRow();
        row.insertCell(0).textContent = usuario.id;
        row.insertCell(1).textContent = usuario.name;
        row.insertCell(2).textContent = usuario.email;
        row.insertCell(3).textContent = traduzirRole(usuario.role);

        const acoesCell = row.insertCell(4);
        const divBotoes = document.createElement("div");
        divBotoes.className = "acoes-container";
        divBotoes.style.display = "flex";
        divBotoes.style.gap = "3px";
        divBotoes.style.justifyContent = "center";
        divBotoes.style.alignItems = "center";

        const botaoEditar = document.createElement("button");
        botaoEditar.className = "action-button botao-editar";
        botaoEditar.innerHTML = `<i class="bi bi-pencil-square"></i>`;
        botaoEditar.addEventListener("click", () => abrirpopupEditarusuario(usuario, row));

        const botaoDeletar = document.createElement("button");
        botaoDeletar.className = "action-button botao-deletar";
        botaoDeletar.innerHTML = `<i class="bi bi-trash-fill"></i>`;
        botaoDeletar.addEventListener("click", () => abrirpopupDeletarusuario(usuario, row));

        divBotoes.appendChild(botaoEditar);
        divBotoes.appendChild(botaoDeletar);
        acoesCell.appendChild(divBotoes);
    });
        renderPaginacao();
        aplicarRestricoesDeUsuario();
    }

        function abrirpopupCadastrarusuario(){
        document.getElementById('novoNomeUsuario').value = '';
        document.getElementById('novoEmailUsuario').value = '';
        document.getElementById('novoSenhaUsuario').value = '';
        document.getElementById('novaPermissao').value = '';
        document.getElementById('popupCadastrarusuario').show();
    }
    function fecharpopupCadastrarusuario(){
        const popupCadastro = document.getElementById('popupCadastrarusuario');
        if (!popupCadastro || !popupCadastro.open) return;
        popupCadastro.classList.add('fechar-animado');
        popupCadastro.addEventListener('animationend', () => {
        popupCadastro.classList.remove('fechar-animado');
        popupCadastro.close();
    }, { once: true });
    }

    async function salvarNovoUsuario() {
        const novoUsuario = {
        name: document.getElementById("novoNomeUsuario").value.trim(),
        email: document.getElementById("novoEmailUsuario").value.trim(),
        password: document.getElementById('novoSenhaUsuario').value.trim(),
        role: document.getElementById("novaPermissao").value.trim(),
        };
        if (!novoUsuario.name || !novoUsuario.email || !novoUsuario.password || !novoUsuario.role) {
            alert("Preencha todos os campos corretamente.");
            return;
        }
        try {
        // const response = 
            await axios.post(baseURL, novoUsuario, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            alert("Usuário cadastrado com sucesso!");
            carregarUsuarios();
            fecharpopupCadastrarusuario();
            // return response.data
        } catch (error) {
            console.error("Erro ao cadastrar o usuário:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível cadastrar o usuário. Tente novamente.");
        }
    }
    // --------------------------------------------------------------------------------------------------
    function abrirpopupEditarusuario (usuario, row) {

    editandoId = usuario.id; // isso é crucial

        document.getElementById('editNomeUsuario').value = usuario.name;
        document.getElementById('editEmailUsuario').value = usuario.email;
        const roleSelect = document.getElementById('editPermissao'); // <— sem acento
        if (roleSelect) {
        roleSelect.value = (usuario.role === 'ADMIN' || usuario.role === 'USER') ? usuario.role : 'USER';
        }
        document.getElementById('popupEditarusuario').showModal(); // <-- já abre
    }
    function fecharpopupEditarusuario() {
        const popupEditar = document.getElementById('popupEditarusuario');
        if (!popupEditar || !popupEditar.open) return;
        popupEditar.classList.add('fechar-animado');
        popupEditar.addEventListener('animationend', () => {
        popupEditar.classList.remove('fechar-animado');
        popupEditar.close();
    }, { once: true });
    }
    async function salvarEdicaoUsuario(usuario) {
        const usuarioId = editandoId; // mesmo controle que você usou para editora
        if (!usuarioId) {
            alert("ID do usuário não encontrado.");
            return;
        }
        const nome = document.getElementById('editNomeUsuario').value.trim();
        const email = document.getElementById('editEmailUsuario').value.trim();
        const senha = document.getElementById('editSenhaUsuario').value.trim();
        const role = document.getElementById('editPermissao').value.trim();
        if (!nome || !email || !role) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }
        try {
            const usuarioAtualizado = {
                name: nome,
                email: email,
                role: role
            };
            if (senha) {
                usuarioAtualizado.password = senha;
            }
            await axios.put(`${baseURL}/${usuarioId}`, usuarioAtualizado, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            alert("Usuário atualizado com sucesso!");
            fecharpopupEditarusuario();
            carregarUsuarios();
            listarUsuarios();
        } catch (error) {
            console.error("Erro ao editar o usuário:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível editar o usuário. Tente novamente.");
        }
    }


    function abrirpopupDeletarusuario(usuario, row) {
        const rowIndex = row.rowIndex - 1;
        const nomeUsuario = row.cells[1].textContent;
        document.getElementById('NomeUsuarioexcluidoIndex').value = rowIndex;
        document.getElementById('NomeUsuarioexcluido').textContent = nomeUsuario;
        document.getElementById('popupDeletarusuario').showModal();
    }
    function fecharpopupDeletarusuario() {
        document.getElementById('popupDeletarusuario').close();
    }

    async function confirmarExclusaoUsuario() {
        try {
            const rowIndex = parseInt(document.getElementById('NomeUsuarioexcluidoIndex').value);
            const tabela = document.getElementById('tabela-dados').getElementsByTagName('tbody')[0];
            const row = tabela.rows[rowIndex];
            const usuario = usuariosFiltrados[rowIndex];
            if (!usuario || !usuario.id) {
                alert("Não foi possível identificar o usuário para exclusão.");
                return;
            }
            await axios.delete(`${baseURL}/${usuario.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            // Remove da tabela e das listas locais
            tabela.deleteRow(rowIndex);
            usuarios = usuarios.filter(u => u.id !== usuario.id);
            usuariosFiltrados = usuariosFiltrados.filter(u => u.id !== usuario.id);
            alert("Usuário excluído com sucesso!");
            fecharpopupDeletarusuario();
            // Atualiza a paginação e recarrega a lista
            renderPaginacao();
            listarUsuarios();
        } catch (error) {
            console.error("Erro ao deletar o usuário:", error.response?.data || error.message);
            const mensagemApi = error.response?.data?.error;
            alert(mensagemApi || "Não foi possível deletar o usuário. Tente novamente.");
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