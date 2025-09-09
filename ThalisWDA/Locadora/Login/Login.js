async function fazerLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const URL = "https://locadora-ryan-back.altislabtech.com.br/auth/login";

    try {
        const response = await axios.post(URL, { email, password });
        const token = response.data.token || response.data.access_token;
        const role = response.data.role || response.data.user?.role;


        localStorage.setItem("token", token);


        if (role) {
            localStorage.setItem("role", role);
        }

        // document.getElementById("renderResults").textContent =
        //     "Login efetuado com sucesso!\nToken:\n" + token;

        // redireciona
        window.location.href = "/Locadora/Dashboard/Dashboard.html";
    } catch (error) {
        // console.error("Erro no login:", error.response?.data || error.message);
        // if (error.response && error.response.status === 403) {
        //     alert("Email ou senha inválidos");
        // } else {
        //     alert("Erro ao fazer login!");
        // }
        // pega a mensagem da API, se não existir usa a mensagem genérica do JS
        const mensagemErro = error.response?.data?.message || error.message || "Erro inesperado";
        
        alert("Erro no login: " + mensagemErro);
    }
}
