const ctx = document.getElementById('doughnutchart');

const API = "https://locadora-ryan-back.altislabtech.com.br/dashboard"; 
const token = localStorage.getItem("token");

// ---------- FUNÇÃO GENÉRICA ----------
async function fetchDado(url, usaTotalElements = false) {
    if (!token) return 0;
    try {
        const resposta = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
        });

        return usaTotalElements
        ? resposta.data.totalElements
        : resposta.data;
    } catch (erro) {
        console.error(`Erro ao buscar ${url}:`, erro.response?.data || erro.message);
        return 0;
    }
}

// ---------- LIVRO MAIS ALUGADO ----------
async function carregarLivroMaisAlugado(meses = 1) {
    const token = localStorage.getItem("token");
    if (!token) return [];
    
    try {
        const resposta = await axios.get(
        `${API}/bookMoreRented?numberOfMonths=${meses}`,
        { headers: { Authorization: `Bearer ${token}` } }
        );

        // a API pode retornar array ou objeto com content
        const livros = resposta.data.content || resposta.data || [];
        const primeiro = Array.isArray(livros) ? livros[0] : null;

        const nomeLivro = primeiro?.name || primeiro?.title || "Título não encontrado";
        const qtdAlugado = primeiro?.totalRents || 0;

        // Atualiza seu HTML
        document.querySelector(".livromaisalugado p").innerText = `${nomeLivro} (${qtdAlugado}x)`;

        return livros;

    } catch (erro) {
        console.error("Erro ao buscar livro mais alugado:", erro);
        document.querySelector(".livromaisalugado p").innerText = "Erro";
        return [];
    }
}

// ---------- STATUS ----------
async function carregarStatusEntregas() {
    return fetchDado(`${API}/deliveredInTimeQuantity?numberOfMonths=1`);
}

async function carregarStatusComDelay() {
    return fetchDado(`${API}/deliveredWithDelayQuantity?numberOfMonths=1`);
}

async function carregarStatusAtrasados() {
    return fetchDado(`${API}/rentsLateQuantity?numberOfMonths=1`);
}

// GRÁFICO DE STATUS DE ENTREGA (Doughnut)
function renderizarGraficoStatus(noPrazo, comDelay, atrasados) {
    const ctx = document.getElementById("doughnutchart").getContext("2d");
    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["No Prazo", "Com Delay", "Atrasados"],
            datasets: [{
                label: "Status de Entregas",
                data: [noPrazo, comDelay, atrasados],
                backgroundColor: [
                "#88C9DF", "#4B8FAC", "#ff5e5eff"
                ],
                hoverOffset: 4
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
        plugins: {
                title: {
                    display: true,
                    text: "Gráfico de Status de Entregas",
                    font: { size: 18, weight: "bold" },
                    color: "#333"
                },
                legend: { position: 'bottom' }
            }
        }
    });
}


// GRÁFICO DE ALUGUÉIS TOTAIS vs COM DELAY (Pie)
function renderizarGraficoComparativo(totalAlugueis, alugueisComDelay) {
    const ctx = document.getElementById("doughnutchart2").getContext("2d");
    new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Todos Aluguéis", "Com Delay"],
            datasets: [{
                label: "Aluguéis Registrados",
                data: [totalAlugueis, alugueisComDelay],
                backgroundColor: [
                "#ffd54dff", "#388e3cb3"
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: "Gráfico de Aluguéis por Livro",
                    font: { size: 18, weight: "bold" },
                    color: "#333"
                },
                legend: { position: 'bottom' }
            }
        }
    })
};
// GRÁFICO DE ALUGUÉIS POR LIVRO (Doughnut)
function renderizarGraficoLivros(livros) {
    if (!livros || livros.length === 0) return;

    const ctx = document.getElementById("doughnutchart1").getContext("2d");
    const labels = livros.map(l => l.name || l.title || "Sem título");
    const valores = livros.map(l => l.totalRents || 0);

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                label: "Aluguéis por Livro",
                data: valores,
                backgroundColor: ["#697bffff", "#ff5555ff", "#75ff3eff", "#81c784", "#4db6ac", "#64b5f6"],
                borderRadius: 8
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Gráfico de Status de Entregas',
                    font: { size: 18, weight: "bold" },
                    color: ["#333"]
                },
                legend: { position: 'bottom' }
            }
        }
    })
};


// ---------- INICIALIZAÇÃO ----------
async function initDashboard() {
    // Carrega livros mais alugados
    const livros = await carregarLivroMaisAlugado();

    // Carrega status de entregas
    const noPrazo = await carregarStatusEntregas();
    const comDelay = await carregarStatusComDelay();
    const atrasados = await carregarStatusAtrasados();

    // Total de aluguéis (todos)
    const totalAlugueis = noPrazo + comDelay + atrasados;

    // Renderiza todos os gráficos
    renderizarGraficoStatus(noPrazo, comDelay, atrasados);          // Doughnut status
    renderizarGraficoLivros(livros);                               // Doughnut livros
    renderizarGraficoComparativo(totalAlugueis, comDelay);         // Pie comparativo
}

// Executa inicialização
initDashboard();
