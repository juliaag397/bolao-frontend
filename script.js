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

// ===== MENU RETRÁTIL =====

// Mostrar área selecionada
function mostrarArea(areaId, event) {

    // Remove classe ativa de todas as áreas
    document.querySelectorAll(".area").forEach(area => {
        area.classList.remove("ativa");
    });

    // Remove classe ativa dos botões
    document.querySelectorAll(".menu-lateral button").forEach(btn => {
        btn.classList.remove("ativo");
    });

    // Ativa a área selecionada
    const areaSelecionada = document.getElementById(areaId);
    if (areaSelecionada) {
        areaSelecionada.classList.add("ativa");
    }

    // Marca botão como ativo
    if (event && event.target) {
        event.target.classList.add("ativo");
    }

    // Fecha o menu
    const menu = document.getElementById("menu");
    if (menu) {
        menu.classList.remove("ativo");
    }
}


// Abrir / Fechar menu lateral
function toggleMenu() {
    const menu = document.getElementById("menu");
    const toggle = document.querySelector(".menu-toggle");

    menu.classList.toggle("ativo");
    toggle.classList.toggle("ativo");
}


// ARTILHEIRO

function verificarLogin() {

    fetch("/verificar-login", {
        credentials: "include"
    })
    .then(res => res.json())
    .then(data => {

        if (!data.logado) {

            document.querySelectorAll("#artilheiros select").forEach(select => {
                select.disabled = true;
            });

            document.querySelectorAll("#artilheiros button").forEach(btn => {
                btn.disabled = true;
            });

        }

    });
}



function verificarPeriodoArtilheiros() {

    const hoje = new Date();

    const inicioCopa = new Date("2026-06-11");
    const fimFaseGrupos = new Date("2026-06-25");
    const inicioMataMata = new Date("2026-06-28");

    const aposta1 = document.getElementById("aposta1");
    const aposta2 = document.getElementById("aposta2");

    if (!aposta1 || !aposta2) return;

    // 🥇 APOSTA 1
    if (hoje >= inicioCopa) {

        const select1 = aposta1.querySelector("select");
        const botao1 = aposta1.querySelector("button");

        if (select1) select1.disabled = true;
        if (botao1) botao1.disabled = true;

        if (!aposta1.querySelector(".mensagem-bloqueio")) {
            const msg = document.createElement("p");
            msg.className = "mensagem-bloqueio";
            msg.style.color = "red";
            msg.textContent = "Apostas encerradas.";
            aposta1.appendChild(msg);
        }
    }

    // 🥈 APOSTA 2
    if (hoje < fimFaseGrupos || hoje >= inicioMataMata) {

        const select2 = aposta2.querySelector("select");
        const botao2 = aposta2.querySelector("button");

        if (select2) select2.disabled = true;
        if (botao2) botao2.disabled = true;

        if (!aposta2.querySelector(".mensagem-bloqueio")) {
            const msg = document.createElement("p");
            msg.className = "mensagem-bloqueio";
            msg.style.color = "red";
            msg.textContent = "Apostas indisponíveis neste período.";
            aposta2.appendChild(msg);
        }
    }

}

// SALVAR ARTILHEIRO
function salvarAposta(tipo) {

    const jogador = document.getElementById("jogador" + tipo).value;

    if (!jogador) {
        alert("Selecione um jogador!");
        return;
    }

    fetch("/salvar-artilheiro", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            tipo: tipo,          // agora chama "tipo"
            jogador: jogador     // permanece igual
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.erro) {
            alert(data.erro);
        } else {
            alert("Aposta salva com sucesso!");
        }
    })
    .catch(err => {
        console.error(err);
        alert("Erro ao salvar aposta.");
    });

}

document.addEventListener("DOMContentLoaded", function () {
    verificarPeriodoArtilheiros();
    verificarLogin();
});

carregarApostas();
bloquearJogosPassados();

document.querySelectorAll("[data-jogo]").forEach(celula => {
    celula.addEventListener("click", function () {
        abrirAposta(this);
    });
});