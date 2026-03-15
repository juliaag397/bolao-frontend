
let usuarioId = null;
let usuarioLogado = false;
let loginCarregando = false

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

    // voltar para tela de login automaticamente
    setTimeout(() => {
        showDemo("login");
    }, 1500);
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

    if (loginCarregando) return;
    loginCarregando = true;

    const email = document.getElementById("li-email").value;
    const senha = document.getElementById("li-senha").value;

    const erro = document.getElementById("li-error");
    const sucesso = document.getElementById("li-success");

    erro.textContent = "";
    sucesso.style.display = "none";

    if (!email || !senha) {
        erro.textContent = "Preencha todos os campos!";
        loginCarregando = false;
        return;
    }

    fetch("https://bolao-backend-k56l.onrender.com/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
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
            loginCarregando = false;
            return;
        }

        if (data.sucesso) {

            usuarioLogado = true;
            usuarioId = data.id;

            localStorage.setItem("usuario_id", data.id);

            document.getElementById("login-form").style.display = "none";
            document.getElementById("area-logada").style.display = "block";

            document.getElementById("boas-vindas").textContent =
                "👋 Bem-vindo(a), " + data.nome;

            fetch(`https://bolao-backend-k56l.onrender.com/apostas/${usuarioId}`, {
                credentials: "include"
            })
            .then(res => res.json())
            .then(apostas => {

                apostas.forEach(aposta => {

                    const celula = document.querySelector(
                        `.celula-aposta[data-jogo-id="${aposta.jogo_id}"]`
                    );

                    if (celula) {
                        celula.innerHTML =
                            aposta.gols_casa + " x " + aposta.gols_fora;
                        celula.dataset.apostado = "true";
                    }

                });

            });

            verificarLogin();

        }

        loginCarregando = false;

    })
    .catch(err => {
        console.error(err);
        erro.textContent = "Erro ao conectar com servidor.";
        loginCarregando = false;
    });
}

    // PARA SAIR
function logout() {

    fetch("https://bolao-backend-k56l.onrender.com/logout", {
        method: "POST",
        credentials: "include"
    })
    .then(() => {

        usuarioLogado = false;
        usuarioId = null;

        document.getElementById("login-form").style.display = "block";
        document.getElementById("area-logada").style.display = "none";

        location.reload(); // 🔥 força atualizar estado

    });

}

    // PARA APOSTAR
function abrirAposta(celula) {

    const agora = new Date();
    const dataJogo = new Date(celula.dataset.data);

    // 🔒 BLOQUEIO REAL BASEADO NA DATA
    if (agora >= dataJogo) {
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
            alert("Preencha os dois campos!");
            return;
        }

        fetch("https://bolao-backend-k56l.onrender.com/apostar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                jogo_id: celula.dataset.jogoId,
                gols_casa: input1.value,
                gols_fora: input2.value
            })
        })
        .then(async res => {

            if (res.status === 403) {
                alert("Este jogo já começou.");
                bloquearJogosPassados(); // 🔥 atualiza visual
                return;
            }

            if (res.status === 401) {
                alert("Sessão expirada. Faça login novamente.");
                return;
            }

            const data = await res.json();

            if (data.erro) {
                alert(data.erro);
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

async function carregarApostas() {

    console.log("usuarioId", usuarioId);

    if (!usuarioId) return;

    try {

        const resposta = await fetch(
            `https://bolao-backend-k56l.onrender.com/apostas/${usuarioId}`,
            {
                credentials: "include" // 🔥 ESSENCIAL para sessão funcionar
            }
        );

        if (!resposta.ok) {
            console.log("Erro ao buscar apostas:", resposta.status);
            return;
        }

        const apostas = await resposta.json();

        console.log("Apostas recebidas:", apostas);

        if (!Array.isArray(apostas)) return;

        apostas.forEach(aposta => {

            const celula = document.querySelector(
                `.celula-aposta[data-jogo-id="${aposta.jogo_id}"]`
            );

            if (celula) {
                celula.innerHTML =
                    `${aposta.gols_casa} x ${aposta.gols_fora}`;

                celula.dataset.apostado = "true";
            }

        });

    } catch (erro) {
        console.log("Erro ao carregar apostas:", erro);
    }
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

    // Se veio de clique
    if (event && event.target) {
        event.target.classList.add("ativo");
    }

    // Se veio do script (ex: Jogos por dia)
    else {

        const botao = document.querySelector(
            `.menu-lateral button[onclick*="${areaId}"]`
        );

        if (botao) {
            botao.classList.add("ativo");
        }

    }

    // Fecha menu mobile
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

function carregarArtilheiros() {

    console.log("CARREGAR ARTILHEIROS FOI CHAMADO");

    fetch("https://bolao-backend-k56l.onrender.com/artilheiros", {
        credentials: "include"
    })
    .then(res => res.json())
    .then(apostas => {

        apostas.forEach(aposta => {

            const select = document.getElementById(
                aposta.tipo == "inicial" ? "jogador1" : "jogador2"
            );

            if (select) {
                select.value = aposta.jogador;
            }

        });

    });

}

async function carregarResultadoArtilheiro() {

    try {

        const res = await fetch(
            "https://bolao-backend-k56l.onrender.com/resultado-artilheiro"
        );

        const data = await res.json();

        document.getElementById("artilheiroOficial").textContent =
            data.artilheiro_oficial || "A definir";

        document.getElementById("golsOficial").textContent =
            (data.gols_artilheiro || "-") + " gols";

    } catch (erro) {

        console.log("Erro ao carregar artilheiro:", erro);

    }
}

    // PONTUACAO TOTAL
async function carregarPontuacao() {

    try {
        const resposta = await fetch(
            "https://bolao-backend-k56l.onrender.com/minha-pontuacao",
            { credentials: "include" }
        );

        if (!resposta.ok) return;

        const data = await resposta.json();

        if (data.pontos !== undefined) {
            const span = document.getElementById("pontuacao-total");
            if (span) {
                span.textContent = data.pontos + " pts";
            }
        }

    } catch (erro) {
        console.log("Erro ao carregar pontuação:", erro);
    }
}

async function verificarLogin() {

    const res = await fetch(
        "https://bolao-backend-k56l.onrender.com/verificar-login",
        { credentials: "include" }
    );

    const data = await res.json();

    const area = document.getElementById("artilheiro");

    if (data.logado) {

        usuarioLogado = true;
        usuarioId = data.id;

        localStorage.setItem("usuario_id", data.id);

        document.getElementById("login-form").style.display = "none";
        document.getElementById("area-logada").style.display = "block";

        document.getElementById("boas-vindas").textContent =
            "👋 Bem-vinda, " + data.nome;

        if (area) {
            area.querySelectorAll("p").forEach(p => {
                if (p.style.color === "red") {
                    p.remove();
                }
            });
        }

        await carregarPontuacao();
        await carregarApostas();
        bloquearJogosPassados();
        await carregarPontosPorJogo();
        await carregarPontosArtilheiro();
        await carregarArtilheiros();
        await carregarRanking();
        await loadUserGroups();
        await carregarJogosBrasil();
        await carregarResultadoArtilheiro();
        montarJogosPorDia();
        carregarPalpitesPodio();
        bloquearPalpitesSeExpirado();
        await carregarConfiguracoesGerais();
        await carregarMataMata();

    } else {

        usuarioLogado = false;

        document.getElementById("area-logada").style.display = "none";
        document.getElementById("login-form").style.display = "block";

        bloquearJogosPassados();
    }
}


function verificarPeriodoArtilheiros() {

    const hoje = new Date();

    const inicioCopa = new Date("2026-06-11");
    const fimFaseGrupos = new Date("2026-06-28T01:30:00");
    const inicioMataMata = new Date("2026-06-28T16:00:00");

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

    let jogador = document.getElementById(
        tipo === 1 ? "jogador1" : "jogador2"
    ).value;

    // remove o país
    jogador = jogador.split(" (")[0];

    fetch("https://bolao-backend-k56l.onrender.com/salvar-artilheiro", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            tipo: tipo === 1 ? "inicial" : "pos_grupos",
            jogador: jogador
        })
    })
    .then(res => {
        if (res.status === 401) {
            alert("Sessão expirada. Faça login novamente.");
            return;
        }
        return res.json();
    })
    .then(data => {

        if (data.erro) {
            alert("Erro ao salvar aposta");
            return;
        }

        alert("Aposta salva com sucesso!");

    })
    .catch(() => {
        alert("Erro ao conectar com servidor");
    });

}

// ===== ATUALIZAR RESULTADO FINAL ARTILHEIRO=====

async function carregarPontosArtilheiro() {

    try {

        const response = await fetch(
            "https://bolao-backend-k56l.onrender.com/pontos-artilheiro",
            { credentials: "include" }
        );

        if (!response.ok) return;

        const data = await response.json();

        const span = document.getElementById("pontosArtilheiro");

        if (span) {
            span.textContent = data.pontos + " pts";
        }

    } catch (erro) {

        console.log("Erro ao carregar pontos artilheiro:", erro);

    }
}

    // CALCULAR PONTOS
async function calcularPontuacao() {

    if (!usuarioId) {
        alert("Usuário não logado");
        return;
    }

    await fetch(`https://bolao-backend-k56l.onrender.com/calcular-pontos/${usuarioId}`, {
        method: "POST",
        credentials: "include"
    });

    // 🔥 Depois de calcular, carrega os pontos
    await carregarPontosPorJogo();
}

async function carregarPontosPorJogo() {

    if (!usuarioId) return;

    const resposta = await fetch(`https://bolao-backend-k56l.onrender.com/apostas/${usuarioId}`, {
        credentials: "include"
    });

    const apostas = await resposta.json();

    apostas.forEach(aposta => {

        const celula = document.querySelector(
            `.pontos-jogo[data-jogo-id="${aposta.jogo_id}"]`
        );

        if (celula) {
            celula.textContent = aposta.pontos ?? 0;
        }

    });
}

    // JOGOS OFICIAIS
async function carregarJogos() {

    const res = await fetch("https://bolao-backend-k56l.onrender.com/jogos");
    const jogos = await res.json();

    jogos.forEach(jogo => {

        const celula = document.querySelector(
            `.placar-oficial[data-jogo-id="${jogo.id}"]`
        );

        if (celula) {
            celula.textContent =
                jogo.gols_casa + " x " + jogo.gols_fora;
        } else {
            console.log("Não encontrou:", jogo.jogo);
        }
    });
}

    //RANKING
async function carregarRanking() {

    try {
        const resposta = await fetch(
            "https://bolao-backend-k56l.onrender.com/ranking",
            { credentials: "include" }
        );

        const ranking = await resposta.json();

        const tbody = document.getElementById("ranking-body");
        tbody.innerHTML = "";

        ranking.forEach((usuario, index) => {

            let medalha;

            if (index === 0) medalha = "🥇";
            else if (index === 1) medalha = "🥈";
            else if (index === 2) medalha = "🥉";
            else medalha = index + 1;

            const linha = document.createElement("tr");

            linha.innerHTML = `
                <td>${medalha}</td>
                <td>${usuario.nome}</td>
                <td>${usuario.pontos}</td>
            `;

            tbody.appendChild(linha);
        });

    } catch (erro) {
        console.log("Erro ao carregar ranking:", erro);
    }
}

    //GRUPOS
function showTab(tabId) {
    document.querySelectorAll('#grupos-info .tab-content')
        .forEach(tab => tab.style.display = 'none');

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
}

async function createGroup() {
    const nameInput = document.getElementById("groupName");
    const rulesInput = document.getElementById("groupRules");

    const name = nameInput.value.trim();
    const rules = rulesInput.value.trim();

    // 🚨 VALIDAÇÃO FRONTEND
    if (!name) {
        alert("O nome do grupo é obrigatório.");
        nameInput.focus();
        return;
    }

    if (!rules) {
        alert("As regras do grupo são obrigatórias.");
        rulesInput.focus();
        return;
    }

    if (name.length < 3) {
        alert("O nome do grupo deve ter pelo menos 3 caracteres.");
        nameInput.focus();
        return;
    }

    try {
        const response = await fetch(
            "https://bolao-backend-k56l.onrender.com/create-group",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ name, rules })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Erro no servidor.");
            return;
        }

        alert("Grupo criado! Código: " + data.code);

        nameInput.value = "";
        rulesInput.value = "";

        await loadUserGroups();

    } catch (error) {
        console.error("Erro:", error);
        alert("Erro de conexão com o servidor.");
    }
}

async function joinGroup() {
    const code = document.getElementById("groupCode").value
        .trim()
        .toUpperCase();

    if (!code) {
        alert("Digite um código.");
        return;
    }

    try {
        const response = await fetch(
            "https://bolao-backend-k56l.onrender.com/join-group",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include", // 👈 AQUI
                body: JSON.stringify({ code })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Erro ao entrar no grupo.");
            return;
        }

        alert("Você entrou no grupo!");
        document.getElementById("groupCode").value = "";
        await loadUserGroups();

    } catch (err) {
        console.error(err);
        alert("Erro de conexão com o servidor.");
    }
}

async function loadRankingInsideGroup(groupId) {
    try {
        const response = await fetch(
            `https://bolao-backend-k56l.onrender.com/ranking-grupo/${groupId}`,
            { credentials: "include" }
        );

        if (!response.ok) {
            throw new Error("Erro ao buscar ranking");
        }

        const data = await response.json();

        const rankingDiv = document.getElementById(`ranking-${groupId}`);
        if (!rankingDiv) return;

        if (!data || data.length === 0) {
            rankingDiv.innerHTML = "<p>Nenhum participante ainda.</p>";
            return;
        }

        let html = `
            <table class="ranking-tabela">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nome</th>
                        <th>Pontos</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach((member, index) => {

            let medalha;

            if (index === 0) medalha = "🥇";
            else if (index === 1) medalha = "🥈";
            else if (index === 2) medalha = "🥉";
            else medalha = index + 1;

            html += `
                <tr>
                    <td>${medalha}</td>
                    <td>${member.nome}</td>
                    <td>${member.score ?? 0}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        rankingDiv.innerHTML = html;

    } catch (error) {
        console.error("Erro ao carregar ranking:", error);
    }
}

async function loadUserGroups() {
    try {
        const response = await fetch(
            "https://bolao-backend-k56l.onrender.com/my-groups",
            {
                method: "GET",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.warn(data.error || "Erro ao buscar grupos.");
            return;
        }

        const container = document.getElementById("myGroupsList");
        if (!container) return;

        container.innerHTML = "";

        if (!data || data.length === 0) {
            container.innerHTML = "<p>Você ainda não participa de nenhum grupo.</p>";
            return;
        }

        let html = "";

        data.forEach(group => {
            html += `
                <div class="grupo-card">

                    <button class="grupo-titulo" onclick="toggleGroup('${group.id}')">
                        ${group.name}
                    </button>

                    <div id="group-details-${group.id}" 
                        class="grupo-detalhes">

                        <div class="grupo-info">
                            <p><span>Código:</span> ${group.code || "----"}</p>

                            <p><span>Regras:</span></p>
                            <div class="grupo-regras">
                                ${group.rules ? group.rules : "Nenhuma regra definida."}
                            </div>
                        </div>

                        <div class="grupo-ranking">
                            <h4>🏆 Ranking</h4>
                            <div id="ranking-${group.id}"></div>
                        </div>

                    </div>

                </div>
            `;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error("Erro de conexão:", err);
    }
}

async function toggleGroup(groupId) {

    const detailsDiv = document.getElementById(`group-details-${groupId}`);
    if (!detailsDiv) return;

    const isOpen = detailsDiv.classList.contains("ativo");

    // 🔒 Fecha todos os outros grupos
    document.querySelectorAll(".grupo-detalhes").forEach(div => {
        div.classList.remove("ativo");
    });

    // Se já estava aberto, só fecha
    if (isOpen) {
        return;
    }

    // Abre o grupo clicado
    detailsDiv.classList.add("ativo");

    // Carrega ranking apenas quando abrir
    await loadRankingInsideGroup(groupId);
}

    // ABA BRASIL
async function carregarJogosBrasil() {

    if (!usuarioId) return;

    const lista = document.getElementById("listaJogosBrasil");
    lista.innerHTML = "";

    try {

        const response = await fetch(
            `https://bolao-backend-k56l.onrender.com/jogos-brasil/${usuarioId}`,
            { credentials: "include" }
        );

        if (!response.ok) {
            throw new Error("Erro ao buscar jogos");
        }

        const jogos = await response.json();

        jogos.forEach(aposta => {

            const div = document.createElement("div");
            div.classList.add("jogo");
            div.dataset.data = aposta.data_jogo;

            div.innerHTML = `
                <strong>⚽ ${aposta.jogo}</strong>

                <p class="palpite">
                    Seu palpite:
                    <span>${aposta.gols_casa} x ${aposta.gols_fora}</span>
                </p>

                <button class="btn-jogadores">
                    Escolher jogadores
                </button>

                <div class="resultado-gols">
                    <strong>⚽ Quem fez os gols:</strong>
                    <span class="gols-reais">-</span>
                </div>

                <div class="pontuacao-aposta">
                    <strong>🏆 Pontos nessa aposta:</strong>
                    <span class="pontos">${aposta.pontos_jogadores || 0}</span>
                </div>

                <hr>
            `;

            lista.appendChild(div);

            const btn = div.querySelector(".btn-jogadores");

            btn.onclick = function () {

                const agora = new Date();
                const dataJogo = new Date(aposta.data_jogo);

                abrirJogadores(aposta.id, aposta.gols_brasil, btn);

            };

            carregarGolsBrasil(aposta.jogo_id, div);
            carregarPontosJogadores(aposta.id, div);
        });

    } catch (error) {
        alert("Erro ao carregar jogos.");
        console.error(error);
    }
}

async function carregarGolsBrasil(jogo_id, jogoDiv) {

    try {

        const response = await fetch(
            `https://bolao-backend-k56l.onrender.com/gols-brasil/${jogo_id}`
        );

        const gols = await response.json();

        if (!gols.length) return;

        const nomes = gols.map(g => g.jogador_nome);

        const span = jogoDiv.querySelector(".gols-reais");

        if (span) {
            span.textContent = nomes.join(", ");
        }

    } catch (err) {
        console.error("Erro ao carregar gols", err);
    }
}

function criarSelectJogadores(golsBrasil, container) {

    // 🔒 Verificar se o jogo já começou
    const jogoDiv = container.closest(".jogo");
    const data = jogoDiv.dataset.data;

    const agora = new Date();
    const dataJogo = new Date(data);

    if (agora >= dataJogo) {
        return; // não cria selects
    }

    container.innerHTML = "";

    golsBrasil = Math.min(golsBrasil, 4);

    const jogadores = [
        "Vinicius Jr",
        "João Pedro",
        "Raphinha",
        "Estevão",
        "Paquetá",
        "Endrick",
        "Gabriel Magalhães",
        "Marquinhos",
        "Casemiro",
        "Bruno Guimarães",
        "Luis Henrique",
        "Martinelli",
        "Neymar"
    ];

    for (let i = 0; i < golsBrasil; i++) {

        const select = document.createElement("select");
        select.classList.add("select-jogador");

        const optionPadrao = document.createElement("option");
        optionPadrao.value = "";
        optionPadrao.textContent = "Selecione o jogador";
        select.appendChild(optionPadrao);

        jogadores.forEach(jogador => {
            const option = document.createElement("option");
            option.value = jogador;
            option.textContent = jogador;
            select.appendChild(option);
        });

        container.appendChild(select);
        container.appendChild(document.createElement("br"));
    }
}

async function salvarJogadores(aposta_id, botao) {

    try {

        const jogoDiv = botao.closest(".jogo");
        const selects = jogoDiv.querySelectorAll(".select-jogador");

        const jogadoresEscolhidos = [];

        selects.forEach(select => {
            if (select.value !== "") {
                jogadoresEscolhidos.push(select.value);
            }
        });

        if (jogadoresEscolhidos.length !== selects.length) {
            alert("Selecione todos os jogadores antes de salvar!");
            return;
        }

        const response = await fetch("https://bolao-backend-k56l.onrender.com/salvar-jogadores", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                aposta_id: aposta_id,
                jogadores: jogadoresEscolhidos
            })
        });

        const data = await response.json();

        if (data.sucesso) {
            alert("Jogadores salvos com sucesso!");
        } else {
            alert(data.erro);
        }

    } catch (error) {
        alert("Erro ao conectar com o servidor.");
        console.error(error);
    }
}

function abrirJogadores(aposta_id, golsBrasil, botao) {

    const jogoDiv = botao.closest(".jogo");

    if (jogoDiv.querySelector(".containerJogadores")) {
        return;
    }

    const container = document.createElement("div");
    container.classList.add("containerJogadores");

    jogoDiv.appendChild(container);

    const data = jogoDiv.dataset.data;
    const agora = new Date();
    const dataJogo = new Date(data);

    // 🔒 JOGO JÁ COMEÇOU
    if (agora >= dataJogo) {

        mostrarJogadoresSalvos(aposta_id, container);

        return;
    }

    // ✅ JOGO NÃO COMEÇOU

    criarSelectJogadores(golsBrasil, container);

    if (aposta_id) {
        carregarJogadores(aposta_id, container);
    }

    const btnSalvar = document.createElement("button");
    btnSalvar.textContent = "Salvar jogadores";
    btnSalvar.onclick = (e) => salvarJogadores(aposta_id, e.target);

    jogoDiv.appendChild(btnSalvar);
}

async function carregarJogadores(aposta_id, container) {

    try {

        const response = await fetch(
            `https://bolao-backend-k56l.onrender.com/jogadores/${aposta_id}`,
            { credentials: "include" }
        );

        const jogadores = await response.json(); // 👈 direto

        if (!Array.isArray(jogadores) || jogadores.length === 0) return;

        const selects = container.querySelectorAll(".select-jogador");

        jogadores.forEach((j, i) => {
            if (selects[i]) {
                selects[i].value = j.jogador_nome;
            }
        });

    } catch (err) {
        console.error("Erro ao carregar jogadores", err);
    }
}

async function carregarPontosJogadores(aposta_id, div) {

  try {

    const response = await fetch(
      `https://bolao-backend-k56l.onrender.com/pontos-jogadores/${aposta_id}`
    );

    if (!response.ok) return;

    const data = await response.json();

    const span = div.querySelector(".pontos");

    if (span) {
      span.textContent = data.pontos || 0;
    }

  } catch (erro) {

    console.error("Erro ao carregar pontos", erro);

  }

}

async function mostrarJogadoresSalvos(aposta_id, container) {

    try {

        const response = await fetch(
            `https://bolao-backend-k56l.onrender.com/jogadores/${aposta_id}`,
            { credentials: "include" }
        );

        const jogadores = await response.json();

        if (!Array.isArray(jogadores) || jogadores.length === 0) {
            container.innerHTML = "<p>Nenhum jogador escolhido</p>";
            return;
        }

        const lista = document.createElement("ul");

        jogadores.forEach(j => {
            const li = document.createElement("li");
            li.textContent = j.jogador_nome;
            lista.appendChild(li);
        });

        container.appendChild(lista);

    } catch (err) {
        console.error("Erro ao carregar jogadores", err);
    }

}

    //MOSTRAR JOGOS POR DIA

function montarJogosPorDia() {

    const container = document.getElementById("lista-jogos-dia");
    container.innerHTML = "";

    const jogos = document.querySelectorAll(".celula-aposta");

    let dias = {};

    jogos.forEach(celula => {

        const tr = celula.closest("tr");

        const jogoId = celula.dataset.jogoId;

        const dataISO = celula.dataset.data;
        const data = new Date(dataISO);

        const dia = data.toLocaleDateString("pt-BR");

        const hora = data.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const selecao1 = tr.children[1].innerHTML;
        const selecao2 = tr.children[3].innerHTML;

        const resultado = tr.querySelector(".placar-oficial").textContent;

        const aposta = celula.textContent;

        if (!dias[dia]) {
            dias[dia] = [];
        }

        dias[dia].push({
            hora,
            selecao1,
            selecao2,
            resultado,
            aposta,
            jogoId
        });

    });

    Object.keys(dias).sort((a,b)=>{
        const d1 = new Date(a.split("/").reverse().join("-"));
        const d2 = new Date(b.split("/").reverse().join("-"));
        return d1 - d2;
    }).forEach(dia => {

        const bloco = document.createElement("div");

        bloco.innerHTML = `
            <h3>${dia}</h3>
            <div class="jogos-dia"></div>
        `;

        const lista = bloco.querySelector(".jogos-dia");

        dias[dia].forEach(jogo => {

            const item = document.createElement("div");

            item.className = "jogo-dia";

            item.innerHTML = `
                <span class="hora">${jogo.hora}</span>

                <span class="time">${jogo.selecao1}</span>

                <span class="placar">${jogo.resultado}</span>

                <span class="time">${jogo.selecao2}</span>

                <span class="separador">|</span>

                <span class="aposta" onclick="irParaJogo(${jogo.jogoId})">🎯 ${jogo.aposta}</span>
            `;

            lista.appendChild(item);

        });

        container.appendChild(bloco);

    });

}

function irParaJogo(jogoId) {

    // abrir aba fase de grupos
    mostrarArea("grupos");

    // encontrar célula do jogo
    const celula = document.querySelector(
        `.celula-aposta[data-jogo-id="${jogoId}"]`
    );

    if (celula) {

        const linha = celula.closest("tr");

        linha.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        linha.style.background = "#fff3cd";

        setTimeout(() => {
            linha.style.background = "";
        }, 2000);
    }

}

    // PODIO
function atualizarBandeira(posicao, selectElement) {
    const codPais = selectElement.value;
    const imgBandeira = document.getElementById(`flag-${posicao}`);

    // Verifica se esse país já foi escolhido nos outros selects
    const todosSelects = [
        document.getElementById("select-1"),
        document.getElementById("select-2"),
        document.getElementById("select-3")
    ];

    const duplicado = todosSelects.some(s => s !== selectElement && s.value === codPais && codPais !== "");

    if (duplicado) {
        alert("Este país já foi escolhido em outra posição do pódio!");
        selectElement.value = ""; // Reseta o select atual
        imgBandeira.src = "https://via.placeholder.com/80x50/cccccc/cccccc";
        return;
    }

    if (codPais) {
        imgBandeira.src = `https://flagcdn.com/w80/${codPais}.png`;
        salvarPodio(); 
    } else {
        imgBandeira.src = "https://via.placeholder.com/80x50/cccccc/cccccc";
    }
}

function salvarPodio() {
    // Pega os valores selecionados nos 3 selects
    const primeiro = document.getElementById("select-1").value;
    const segundo = document.getElementById("select-2").value;
    const terceiro = document.getElementById("select-3").value;

    if (!primeiro || !segundo || !terceiro) {
        return;
    }

    fetch("https://bolao-backend-k56l.onrender.com/salvar-podio", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include", // Importante para manter a sessão do usuário
        body: JSON.stringify({
            primeiro: primeiro,
            segundo: segundo,
            terceiro: terceiro
        })
    })
    .then(res => {
        if (res.status === 401) {
            alert("Sessão expirada. Faça login novamente.");
            return;
        }
        return res.json();
    })
    .then(data => {
        if (data?.erro) {
            alert("Erro ao salvar aposta: " + data.erro);
            return;
        }
        console.log("Salvo automaticamente:", data);
    })
    .catch(() => {
        alert("Erro ao conectar com servidor");
    });
}

// Função que preenche o pódio com o que vem do banco
function carregarPalpitesPodio() {
    fetch("https://bolao-backend-k56l.onrender.com/obter-podio", {
        credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
        if (data) {
            // Preenche os selects
            document.getElementById("select-1").value = data.primeiro_lugar || "";
            document.getElementById("select-2").value = data.segundo_lugar || "";
            document.getElementById("select-3").value = data.terceiro_lugar || "";

            // Mapeia os pontos vindos do backend para facilitar o loop
            const pontosMapeados = {
                1: data.pts1,
                2: data.pts2,
                3: data.pts3
            };

            [1, 2, 3].forEach(pos => {
                const select = document.getElementById(`select-${pos}`);
                const img = document.getElementById(`flag-${pos}`);
                const divPontos = document.getElementById(`pontos-${pos}`); // Busca a div de pontos
                
                // --- Lógica das Bandeiras ---
                if (select.value && select.value !== "") {
                    img.src = `https://flagcdn.com/w80/${select.value}.png`;
                } else {
                    img.src = "https://via.placeholder.com/80x50/cccccc/cccccc";
                }

                // --- Lógica dos Pontos ---
                const pts = pontosMapeados[pos];

                if (divPontos) {
                    // Só mostra se pts não for null (ou seja, se já houver resultado oficial)
                    if (pts !== null && pts !== undefined) {
                        divPontos.innerText = `${pts} pts`;
                        divPontos.style.display = "block"; 
                        
                        // Estilização dinâmica
                        divPontos.style.color = pts === 10 ? "#28a745" : "#dc3545"; // Verde ou Vermelho
                    } else {
                        divPontos.style.display = "none"; // Esconde se a Copa não começou/terminou
                    }
                }
            });
        }
    })
    .catch(err => console.error("Erro ao carregar pódio:", err));
}

function bloquearPalpitesSeExpirado() {
    fetch("https://bolao-backend-k56l.onrender.com/obter-configuracoes") // Crie essa rota GET se não tiver
    .then(res => res.json())
    .then(config => {
        const dataLimite = new Date(config.data_limite_podio);
        const agora = new Date();

        if (agora > dataLimite) {
            // Desabilita os selects do pódio
            document.querySelectorAll("#select-1, #select-2, #select-3").forEach(select => {
                select.disabled = true;
            });
            
            // Opcional: Avisar o usuário
            console.log("Apostas encerradas.");
        }
    });
}

async function carregarConfiguracoesGerais() {
    try {
        // Chamando a nova rota que traz todos os dados
        const res = await fetch(
            "https://bolao-backend-k56l.onrender.com/obter-configuracoes"
        );
        const data = await res.json();

        if (data) {
            // 1. Atualiza o Artilheiro Oficial (o que a antiga já fazia)
            if (data.artilheiro_oficial) {
                document.getElementById("artilheiroOficial").innerText = data.artilheiro_oficial;
            }

            // 2. BLOQUEIO DE SEGURANÇA (Data Limite)
            const dataLimite = new Date(data.data_limite_podio);
            const agora = new Date();

            if (agora > dataLimite) {
                console.log("🔒 Prazo encerrado. Bloqueando selects...");
                // Desabilita os selects do pódio
                const selects = ["select-1", "select-2", "select-3"];
                selects.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.disabled = true;
                });
                
                // Opcional: Avisar o usuário na tela
                const statusApostas = document.getElementById("status-apostas");
                if (statusApostas) statusApostas.innerText = "Apostas encerradas!";
            }
        }
    } catch (erro) {
        console.log("Erro ao carregar configurações:", erro);
    }
}

    //MATA-MATA------------------------------
async function carregarMataMata() {
    try {
        const res = await fetch("https://bolao-backend-k56l.onrender.com/jogos");
        const jogos = await res.json();

        // Filtra apenas os jogos do mata-mata (conforme sua planilha, começam no 73/74)
        const jogosMataMata = jogos.filter(j => j.id >= 73);

        jogosMataMata.forEach(jogo => {
            // Lógica de interrogação se o time ainda não estiver definido
            const times = jogo.jogo ? jogo.jogo.split(" x ") : ["?", "?"];
            const timeCasa = times[0]?.trim() || "?";
            const timeFora = times[1]?.trim() || "?";

            // Placar oficial (vencido pelo banco de dados)
            const placarOficial = (jogo.gols_casa !== null && jogo.gols_fora !== null) 
                ? `${jogo.gols_casa} x ${jogo.gols_fora}` 
                : "- x -";

            // Card estruturado com suas classes para CSS temático
            const cardHTML = `
                <div class="match-card">
                    <span class="match-date">📅 ${new Date(jogo.data_jogo).toLocaleDateString('pt-BR')}</span>
                    
                    <div class="team-row">
                        <span class="team-name">${timeCasa}</span>
                        <div class="placar-oficial" data-jogo-id="${jogo.id}">
                             ${placarOficial}
                        </div>
                        <span class="team-name" style="text-align:right;">${timeFora}</span>
                    </div>

                    <div class="match-actions" style="margin-top:10px;">
                        <div class="celula-aposta" 
                             data-jogo-id="${jogo.id}" 
                             data-data="${jogo.data_jogo}" 
                             onclick="abrirAposta(this)"
                             style="cursor:pointer; text-align:center; padding:5px; border:1px dashed var(--cor-borda); border-radius:5px;">
                             Apostar
                        </div>
                    </div>
                    <small style="display:block; text-align:center; color:#999; font-size:9px; margin-top:5px;">Jogo ${jogo.id}</small>
                </div>
            `;

            // DISTRIBUIÇÃO CONFORME A PLANILHA
            let colunaId = "";

            const id = parseInt(jogo.id);

            // Lado Esquerdo - Seguindo a imagem de cima para baixo
            if ([74, 77, 73, 75, 83, 84, 81, 82].includes(id)) {
                document.getElementById('round-32-left').innerHTML += cardHTML;
            } 
            else if ([89, 90, 93, 94].includes(id)) {
                document.getElementById('round-16-left').innerHTML += cardHTML;
            } 
            else if ([97, 98].includes(id)) {
                document.getElementById('round-8-left').innerHTML += cardHTML;
            }

            // Lado Direito - Seguindo a imagem de cima para baixo
            else if ([76, 78, 79, 80, 86, 88, 85, 87].includes(id)) {
                document.getElementById('round-32-right').innerHTML += cardHTML;
            } 
            else if ([91, 92, 95, 96].includes(id)) {
                document.getElementById('round-16-right').innerHTML += cardHTML;
            } 
            else if ([99, 100].includes(id)) {
                document.getElementById('round-8-right').innerHTML += cardHTML;
            }

            // Centro (Semifinais e Final)
            else if (id === 101) document.getElementById('semifinal-top').innerHTML += cardHTML;
            else if (id === 102) document.getElementById('semifinal-bottom').innerHTML += cardHTML;
            else if (id === 104) document.getElementById('grand-final').innerHTML += cardHTML;
            else if (id === 103) {
                // 3º Lugar fica na caixa da final ou logo abaixo
                const grandFinal = document.getElementById('grand-final');
                if (grandFinal) grandFinal.innerHTML += `<p style='margin:10px 0; font-size:12px; font-weight:bold;'>3º LUGAR</p>` + cardHTML;
            }

            if (colunaId) {
                const coluna = document.getElementById(colunaId);
                if (coluna) coluna.innerHTML += cardHTML;
            }
        });

        // Preenche as apostas já feitas e bloqueia as passadas
        await carregarApostas();
        bloquearJogosPassados();

    } catch (erro) {
        console.error("Erro ao montar mata-mata:", erro);
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    verificarPeriodoArtilheiros();
    await carregarJogos();
    await verificarLogin();
});

document.querySelectorAll(".celula-aposta").forEach(celula => {
    celula.addEventListener("click", function () {
        abrirAposta(this);
    });
});