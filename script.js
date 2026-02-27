let usuarioLogado = false;
let usuarioId = null;

// ===============================
// TROCAR ENTRE LOGIN E CADASTRO
// ===============================

function showDemo(tipo) {
    const loginForm = document.getElementById("login-form");
    const cadastroForm = document.getElementById("cadastro-form");

    if (tipo === "cadastro") {
        loginForm.style.display = "none";
        cadastroForm.style.display = "block";
    } else {
        loginForm.style.display = "block";
        cadastroForm.style.display = "none";
    }
}

// ===============================
// CADASTRO
// ===============================

function fazerCadastro() {
    const nome = document.getElementById("ca-nome").value;
    const email = document.getElementById("ca-email").value;
    const senha = document.getElementById("ca-senha").value;
    const confirma = document.getElementById("ca-confirma").value;

    const erro = document.getElementById("ca-error");
    const sucesso = document.getElementById("ca-success");

    erro.textContent = "";
    sucesso.style.display = "none";

    // Validações
    if (!nome || !email || !senha || !confirma) {
        erro.textContent = "Preencha todos os campos!";
        return;
    }

    if (senha.length < 6) {
        erro.textContent = "A senha deve ter no mínimo 6 caracteres!";
        return;
    }

    if (senha !== confirma) {
        erro.textContent = "As senhas não coincidem!";
        return;
    }

    // Enviar para o backend
    fetch("https://bolao-backend-k56l.onrender.com/cadastro", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nome: nome,
            email: email,
            senha: senha
        })
    })
    .then(res => res.json())
    .then(data => {
    console.log(data);

    if (data.erro) {
        erro.textContent = data.erro;
        return;
    }

    sucesso.style.display = "block";

    // Limpar campos
    document.getElementById("ca-nome").value = "";
    document.getElementById("ca-email").value = "";
    document.getElementById("ca-senha").value = "";
    document.getElementById("ca-confirma").value = "";
})
.catch(err => {
        console.error(err);
        erro.textContent = "Erro ao conectar com servidor.";
});
}

// ===============================
// LOGIN
// ===============================

function fazerLogin() {
    const email = document.getElementById("li-email").value;
    const senha = document.getElementById("li-senha").value;

    const erro = document.getElementById("li-error");
    const sucesso = document.getElementById("li-success");

    erro.textContent = "";
    sucesso.style.display = "none";

    if (!email || !senha) {
        erro.textContent = "Preencha todos os campos!";
        return;
    }

    fetch("https://bolao-backend-k56l.onrender.com/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            senha: senha
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);

        if (data.erro) {
            erro.textContent = data.erro;
            return;
        }

        // 🔥 LOGIN DEU CERTO
        usuarioLogado = true; // ✅ ATIVA LOGIN
        usuarioId = data.id;

        fetch(`https://bolao-backend-k56l.onrender.com/apostas/${usuarioId}`)
            .then(res => res.json())
            .then(apostas => {

                apostas.forEach(aposta => {

                    const celula = document.querySelector(
                        `[data-jogo="${aposta.jogo}"]`
                    );

                    if (celula) {
                        celula.innerHTML = aposta.gols_casa + " x " + aposta.gols_fora;
                        celula.dataset.apostado = "true";
                    }

                });

            });

        document.getElementById("login-form").style.display = "none";
        document.getElementById("area-logada").style.display = "block";

        document.getElementById("boas-vindas").textContent =
            "👋 Bem-vinda, " + data.nome;
    })
    .catch(err => {
        console.error(err);
        erro.textContent = "Erro ao conectar com servidor.";
    });
}

    // PARA SAIR
function logout() {

    // 🔒 Desativa login
    usuarioLogado = false;

    // 🧹 Limpa todos os palpites
    const celulas = document.querySelectorAll("[data-jogo]");

    celulas.forEach(celula => {
        celula.innerHTML = '<span class="palpite">Apostar</span>';
        celula.dataset.apostado = "false";
        celula.onclick = function() { abrirAposta(this); };
    });

    // 👀 Mostra login novamente
    document.getElementById("login-form").style.display = "block";

    // 🙈 Esconde área logada
    document.getElementById("area-logada").style.display = "none";

    // ❌ Limpa mensagens de erro
    const erro = document.getElementById("li-error");
    if (erro) erro.textContent = "";
}

    // PARA APOSTAR
function abrirAposta(celula) {

    // 🚨 BLOQUEIA SE NÃO ESTIVER LOGADO
    if (!usuarioLogado) {
        alert("Você precisa estar logado para apostar!");
        return;
    }

    // Se já apostou, trava
    if (celula.dataset.apostado === "true" && celula.dataset.encerrado === "true") return;

    // data
    if (celula.dataset.encerrado === "true") {
        alert("Apostas encerradas para este jogo!");
        return;
    }

    // Se já abriu input, não cria outro
    if (celula.querySelector("input")) return;

    const input1 = document.createElement("input");
    input1.type = "number";
    input1.min = "0";
    input1.style.width = "50px";

    const input2 = document.createElement("input");
    input2.type = "number";
    input2.min = "0";
    input2.style.width = "50px";

    const botao = document.createElement("button");
    botao.textContent = "OK";

    botao.onclick = function (event) {
        event.stopPropagation();

        if (input1.value === "" || input2.value === "") {
            alert("Preencha os dois gols!");
            return;
        }

        fetch("https://bolao-backend-k56l.onrender.com/apostar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_id: usuarioId,
                jogo: celula.dataset.jogo,
                gols_casa: input1.value,
                gols_fora: input2.value
            })
        })
        .then(res => res.json())
        .then(data => {

            if (data.erro) {
                alert("Erro ao salvar aposta");
                return;
            }

            celula.innerHTML = input1.value + " x " + input2.value;
            celula.dataset.apostado = "true";

        })
        .catch(() => {
            alert("Erro ao conectar com servidor");
        });
    };

    input1.addEventListener("click", e => e.stopPropagation());
    input2.addEventListener("click", e => e.stopPropagation());

    celula.innerHTML = "";
    celula.appendChild(input1);
    celula.appendChild(document.createTextNode(" x "));
    celula.appendChild(input2);
    celula.appendChild(botao);
}

function carregarApostas() {

    console.log("usuarioId", usuarioId);

    if (!usuarioId) return;

    fetch(`https://bolao-backend-k56l.onrender.com/apostas/${usuarioId}`)
        .then(res => res.json())
        .then(apostas => {
            console.log("Apostas recebidas:", apostas);

            apostas.forEach(aposta => {

                const celula = document.querySelector(
                    `[data-jogo="${aposta.jogo}"]`
                );

                if (celula) {
                    celula.innerHTML =
                        aposta.gols_casa + " x " + aposta.gols_fora;

                    celula.dataset.apostado = "true";
                }

            });

        });
}

    // BLOQUEAR OS JOGOS DO DIA
function bloquearJogosPassados() {

    const hoje = new Date();
    const celulas = document.querySelectorAll("[data-data]");

    celulas.forEach(celula => {

        const dataJogo = new Date(celula.dataset.data);

        if (hoje >= dataJogo) {

            celula.style.backgroundColor = "#ccc";
            celula.style.cursor = "not-allowed";
            celula.dataset.encerrado = "true";

            // 🔥 SÓ MOSTRA "Encerrado" SE NÃO TIVER APOSTA
            if (celula.dataset.apostado !== "true") {
                celula.innerHTML = "<span class='palpite'>Encerrado</span>";
            }

        }

    });
}

    // MENU
function mostrarArea(areaId, event) {

    // Esconde todas as áreas
    const areas = document.querySelectorAll(".area");
    areas.forEach(area => area.style.display = "none");

    // Remove classe ativa dos botões
    const botoes = document.querySelectorAll(".menu-lateral button");
    botoes.forEach(btn => btn.classList.remove("ativo"));

    // Mostra área selecionada
    document.getElementById(areaId).style.display = "block";

    // Ativa botão clicado
    event.target.classList.add("ativo");
}

carregarApostas();
bloquearJogosPassados();

document.querySelectorAll("[data-jogo]").forEach(celula => {
    celula.addEventListener("click", function () {
        abrirAposta(this);
    });
});