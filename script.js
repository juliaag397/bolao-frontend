
let usuarioId = null;
let usuarioLogado = false;

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
        credentials: "include", // 🔥 OBRIGATÓRIO
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

        if (data.sucesso) {
        verificarLogin();
        }

        // 🔥 LOGIN DEU CERTO
        usuarioLogado = true; // ✅ ATIVA LOGIN
        usuarioId = data.id;

        fetch(`https://bolao-backend-k56l.onrender.com/apostas/${usuarioId}`, {
            credentials: "include"
        })
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
            credentials: "include",
            body: JSON.stringify({
                usuario_id: usuarioId,
                jogo: celula.dataset.jogo,
                gols_casa: input1.value,
                gols_fora: input2.value
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
                `.celula-aposta[data-jogo="${aposta.jogo}"]`
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
        await carregarPontosPorJogo();
        await carregarArtilheiros();
        await carregarRanking();
        await loadUserGroups();
        bloquearJogosPassados();

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

function atualizarResultadoFinal(nome, gols) {

    // Atualiza nome do artilheiro
    document.getElementById("artilheiroOficial").innerText = nome;

    // Atualiza total de gols
    document.getElementById("golsOficial").innerText = gols + " gols";
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
            `.pontos-jogo[data-pontos="${aposta.jogo}"]`
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
            `.placar-oficial[data-placar="${jogo.jogo}"]`
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
    const name = document.getElementById("groupName").value.trim();
    const rules = document.getElementById("groupRules").value.trim();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        alert("Você precisa estar logado.");
        return;
    }

    // gera código aleatório
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // cria grupo
    const { data: group, error } = await supabase
        .from("groups")
        .insert([
            {
                name,
                rules,
                code,
                created_by: user.id
            }
        ])
        .select()
        .single();

    if (error) {
        console.error(error);
        alert("Erro ao criar grupo");
        return;
    }

    // adiciona criador como membro
    await supabase.from("group_members").insert([
        {
            group_id: group.id,
            user_id: user.id,
            score: 0
        }
    ]);

    alert("Grupo criado! Código: " + code);

    await loadUserGroups();
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
        const response = await fetch("/api/join-group", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Erro ao entrar no grupo.");
            return;
        }

        alert("Você entrou no grupo!");
        await loadUserGroups();

    } catch (err) {
        console.error(err);
        alert("Erro de conexão com o servidor.");
    }
}

async function loadRanking(groupId) {
    if (!groupId) return;

    const { data, error } = await supabase
        .from('group_members')
        .select(`
            score,
            user_id,
            users:user_id ( email )
        `)
        .eq('group_id', groupId)
        .order('score', { ascending: false });

    if (error) {
        console.error("Erro ao carregar ranking:", error);
        return;
    }

    const rankingDiv = document.getElementById("ranking");
    if (!rankingDiv) return;

    rankingDiv.innerHTML = "";

    if (!data || data.length === 0) {
        rankingDiv.innerHTML = "<p>Nenhum participante ainda.</p>";
        return;
    }

    let html = "";

    data.forEach((member, index) => {
        const email = member.users?.email || "Usuário";
        const score = member.score ?? 0;

        html += `
            <div>
                ${index + 1}º - ${email} - ${score} pontos
            </div>
        `;
    });

    rankingDiv.innerHTML = html;
}

async function loadUserGroups() {
    try {
        const response = await fetch("/api/my-groups");

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
                <button onclick="openGroup('${group.id}')">
                    ${group.name}
                </button>
            `;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error("Erro de conexão:", err);
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