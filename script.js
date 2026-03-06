
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
                "👋 Bem-vinda, " + data.nome;

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
            alert("Preencha os dois gols!");
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
        await carregarArtilheiroOficial();

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

    fetch("https://bolao-backend-k56l.onrender.com/salvar-artilheiro", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            tipo: tipo === 1 ? "inicial" : "pos_grupos",
            jogador: document.getElementById(
                tipo === 1 ? "jogador1" : "jogador2"
            ).value
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

async function carregarArtilheiroOficial() {

    try {

        const res = await fetch(
            "https://bolao-backend-k56l.onrender.com/artilheiro-oficial"
        );

        const data = await res.json();

        if (data.artilheiro_oficial) {

            document.getElementById("artilheiroOficial").innerText =
                data.artilheiro_oficial;

        }

    } catch (erro) {

        console.log("Erro ao carregar artilheiro:", erro);

    }
}

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