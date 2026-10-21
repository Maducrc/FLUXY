const btnPublicar = document.getElementById("btnPublicar");
const campoConteudo = document.getElementById("conteudoPublicacao");
const tipoPublicacao = document.getElementById("tipoPublicacao");

const listaComunicados = document.getElementById("listaComunicados");
const filtroSetor = document.getElementById("filtroSetor");
const filtroTipo = document.getElementById("filtroTipo");

// Identifica o usuário conectado
const paginaGeral = document.getElementById("paginaGeral");
const usuarioId = Number(paginaGeral?.dataset.usuarioId);

// Guarda o ID da publicação que está sendo editada
let publicacaoEmEdicao = null;

const tiposPermitidos = [
    "Aviso",
    "Agendamento",
    "Comunicado",
    "Atualização"
];

const icones = {
    "Aviso": "bi-megaphone",
    "Agendamento": "bi-calendar-event",
    "Comunicado": "bi-chat-square-text",
    "Atualização": "bi-arrow-repeat"
};

// Carrega os setores da empresa
async function carregarSetores() {
    const resposta = await fetch("/setores-empresa");
    const dados = await resposta.json();

    if (!resposta.ok || !dados.sucesso) {
        throw new Error(dados.mensagem || "Erro ao carregar setores.");
    }

    filtroSetor.replaceChildren();

    const todos = document.createElement("option");
    todos.value = "todos";
    todos.textContent = "Todos os setores";
    filtroSetor.appendChild(todos);

    dados.setores.forEach((setor) => {
        const opcao = document.createElement("option");
        opcao.value = setor.id;
        opcao.textContent = setor.setor;
        filtroSetor.appendChild(opcao);
    });
}

// Formata a data
function formatarData(data) {
    if (!data) return "Data indisponível";

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
        return "Data indisponível";
    }

    return dataFormatada.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Cria elementos de texto com segurança
function criarTexto(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) elemento.className = classe;

    elemento.textContent = texto ?? "";

    return elemento;
}

// Cria botões de ação
function criarBotao(texto, classe, icone) {
    const botao = document.createElement("button");

    botao.type = "button";
    botao.className = classe;
    botao.appendChild(criarTexto("span", "", texto));

    if (icone) {
        const simbolo = document.createElement("i");
        simbolo.className = `bi ${icone}`;
        botao.prepend(simbolo);
    }

    return botao;
}

// Renderiza as publicações
function renderizarPublicacoes(publicacoes) {
    listaComunicados.replaceChildren();

    if (publicacoes.length === 0) {
        listaComunicados.appendChild(
            criarTexto("p", "feed-vazio", "Nenhuma publicação encontrada.")
        );
        return;
    }

    publicacoes.forEach((post) => {
        const artigo = document.createElement("article");
        artigo.className = "comunicado";

        const icone = document.createElement("div");
        icone.className = "icone-comunicado";

        const simbolo = document.createElement("i");
        simbolo.className = `bi ${icones[post.tipo] || "bi-file-text"}`;
        icone.appendChild(simbolo);

        const info = document.createElement("div");
        info.className = "comunicado-info";

        const cabecalho = document.createElement("div");
        cabecalho.className = "comunicado-cabecalho";

        const identificacao = document.createElement("div");

        identificacao.appendChild(
            criarTexto("h3", "", post.autor_nome)
        );

        identificacao.appendChild(
            criarTexto(
                "span",
                "",
                `${post.setor_nome} • ${formatarData(post.criado_em)}`
            )
        );

        cabecalho.appendChild(identificacao);

        // Menu de ações: somente o autor vê os botões
        if (Number(post.usuario_id) === usuarioId) {
            const acoes = document.createElement("div");
            acoes.className = "acoes-publicacao";

            const botaoMenu = document.createElement("button");
            botaoMenu.type = "button";
            botaoMenu.className = "mostrar-mais";
            botaoMenu.setAttribute("aria-label", "Ações da publicação");
            botaoMenu.setAttribute("aria-expanded", "false");

            const iconeMenu = document.createElement("i");
            iconeMenu.className = "bi bi-three-dots-vertical";
            botaoMenu.appendChild(iconeMenu);

            const menu = document.createElement("div");
            menu.className = "menu-publicacao";
            menu.hidden = true;

            const botaoEditar = criarBotao(
                "Editar",
                "acao-editar",
                "bi-pencil"
            );

            const botaoExcluir = criarBotao(
                "Excluir",
                "acao-excluir",
                "bi-trash"
            );

            botaoMenu.addEventListener("click", () => {
                const vaiAbrir = menu.hidden;

                // Fecha os outros menus abertos
                document.querySelectorAll(".menu-publicacao").forEach((outroMenu) => {
                    outroMenu.hidden = true;
                });

                document.querySelectorAll(".mostrar-mais").forEach((outroBotao) => {
                    outroBotao.setAttribute("aria-expanded", "false");
                });

                menu.hidden = !vaiAbrir;
                botaoMenu.setAttribute("aria-expanded", String(vaiAbrir));
            });

            botaoEditar.addEventListener("click", () => {
                iniciarEdicao(post);
                menu.hidden = true;
                botaoMenu.setAttribute("aria-expanded", "false");
            });

            botaoExcluir.addEventListener("click", async () => {
                menu.hidden = true;
                botaoMenu.setAttribute("aria-expanded", "false");
                await excluirPublicacao(post.id);
            });

            menu.append(botaoEditar, botaoExcluir);
            acoes.append(botaoMenu, menu);
            cabecalho.appendChild(acoes);
        }

        const conteudo = criarTexto("p", "", post.conteudo);

        const rodape = document.createElement("div");
        rodape.className = "comunicado-rodape";

        const categoria = criarTexto("span", "tag", post.tipo);
        rodape.appendChild(categoria);

        info.append(cabecalho, conteudo, rodape);
        artigo.append(icone, info);

        listaComunicados.appendChild(artigo);
    });
}

// Busca publicações respeitando os filtros
async function carregarPublicacoes() {
    try {
        const parametros = new URLSearchParams({
            setorId: filtroSetor.value,
            tipo: filtroTipo.value
        });

        const resposta = await fetch(`/publicacoes?${parametros}`);

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Erro ao carregar publicações.");
        }

        renderizarPublicacoes(dados.publicacoes);
    } catch (erro) {
        console.error("Erro ao buscar publicações:", erro);

        listaComunicados.replaceChildren(
            criarTexto("p", "feed-erro", "Não foi possível carregar as publicações.")
        );
    }
}

// Prepara o formulário para editar
function iniciarEdicao(post) {
    publicacaoEmEdicao = post.id;

    campoConteudo.value = post.conteudo;
    tipoPublicacao.value = post.tipo;

    btnPublicar.textContent = "Salvar alterações";

    // Adiciona um botão para cancelar a edição
    let botaoCancelarEdicao = document.getElementById("cancelarEdicao");

    if (!botaoCancelarEdicao) {
        botaoCancelarEdicao = criarBotao(
            "Cancelar edição",
            "btn-cancelar-edicao"
        );

        botaoCancelarEdicao.id = "cancelarEdicao";
        btnPublicar.insertAdjacentElement("beforebegin", botaoCancelarEdicao);

        botaoCancelarEdicao.addEventListener("click", cancelarEdicao);
    }

    botaoCancelarEdicao.hidden = false;

    campoConteudo.focus();
    campoConteudo.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// Cancela a edição
function cancelarEdicao() {
    publicacaoEmEdicao = null;
    campoConteudo.value = "";
    tipoPublicacao.value = "Aviso";
    btnPublicar.textContent = "Publicar";

    const botaoCancelarEdicao = document.getElementById("cancelarEdicao");

    if (botaoCancelarEdicao) {
        botaoCancelarEdicao.hidden = true;
    }
}

// Publica ou salva alterações
btnPublicar.addEventListener("click", async () => {
    const conteudo = campoConteudo.value.trim();
    const tipo = tipoPublicacao.value;

    if (!conteudo) {
        alert("Digite o conteúdo da publicação.");
        return;
    }

    if (!tiposPermitidos.includes(tipo)) {
        alert("Selecione uma categoria válida.");
        return;
    }

    btnPublicar.disabled = true;

    try {
        const editando = publicacaoEmEdicao !== null;

        const url = editando
            ? `/publicacoes/${publicacaoEmEdicao}`
            : "/publicacoes";

        const resposta = await fetch(url, {
            method: editando ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ conteudo, tipo })
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível salvar.");
        }

        cancelarEdicao();

        // Volta aos filtros gerais para encontrar o post atualizado
        filtroSetor.value = "todos";
        filtroTipo.value = "todos";

        await carregarPublicacoes();

    } catch (erro) {
        console.error("Erro ao salvar publicação:", erro);
        alert(erro.message || "Não foi possível salvar a publicação.");
    } finally {
        btnPublicar.disabled = false;
    }
});

// Exclui uma publicação
async function excluirPublicacao(id) {
    const confirmar = confirm(
        "Tem certeza de que deseja excluir esta publicação? Essa ação não poderá ser desfeita."
    );

    if (!confirmar) return;

    try {
        const resposta = await fetch(`/publicacoes/${id}`, {
            method: "DELETE"
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível excluir.");
        }

        await carregarPublicacoes();

    } catch (erro) {
        console.error("Erro ao excluir publicação:", erro);
        alert(erro.message || "Não foi possível excluir a publicação.");
    }
}

// Filtros
filtroSetor.addEventListener("change", carregarPublicacoes);
filtroTipo.addEventListener("change", carregarPublicacoes);

// Inicializa o feed
async function iniciarFeed() {
    try {
        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            throw new Error("Não foi possível identificar o usuário conectado.");
        }

        await carregarSetores();
        await carregarPublicacoes();
    } catch (erro) {
        console.error("Erro ao iniciar o feed:", erro);

        listaComunicados.replaceChildren(
            criarTexto("p", "feed-erro", erro.message || "Não foi possível carregar o feed.")
        );
    }
}

iniciarFeed();
