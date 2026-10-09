const formulario = document.getElementById("cadastroForm");
const campoEmpresa = document.getElementById("empresa");
const campoSetor = document.getElementById("setor");

campoEmpresa.addEventListener("change", async () => {
    const empresaId = campoEmpresa.value;

    campoSetor.innerHTML = "";

    if (!empresaId) {
        campoSetor.disabled = true;
        campoSetor.add(new Option("Selecione primeiro uma empresa", ""));
        return;
    }

    campoSetor.disabled = true;
    campoSetor.add(new Option("Carregando setores...", ""));

    try {
        const resposta = await fetch(`/empresas/${empresaId}/setores`);
        const dados = await resposta.json();

        console.log("Status da resposta:", resposta.status);
        console.log("Dados recebidos:", dados);

        campoSetor.innerHTML = "";

        if (!resposta.ok || !dados.sucesso) {
            campoSetor.add(new Option("Erro ao carregar setores", ""));
            return;
        }

        console.log("Setores recebidos:", dados.setores);
        console.log("Quantidade de setores:", dados.setores.length);

        if (dados.setores.length === 0) {
            campoSetor.add(new Option("Esta empresa não possui setores", ""));
            return;
        }

        campoSetor.add(new Option("Selecione um setor", ""));

        dados.setores.forEach((setor) => {
            campoSetor.add(new Option(setor.setor, setor.id));
        });

        campoSetor.disabled = false;

    } catch (erro) {
        console.error("Erro ao buscar setores:", erro);
        campoSetor.innerHTML = "";
        campoSetor.add(new Option("Erro ao carregar setores", ""));
    }
});

formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;
    const empresa = campoEmpresa.value;
    const setor = campoSetor.value;
    const sigla = document.getElementById("sigla").value.trim();

    if (!empresa || !setor) {
        alert("Selecione uma empresa e um setor.");
        return;
    }

    try {
        const resposta = await fetch("/cadastro", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome,
                usuario,
                senha,
                sigla,
                empresa,
                setor
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            alert(`Não foi possível cadastrar o usuário: ${dados.mensagem}`);
            return;
        }

        const confirmar = window.confirm(
            `${dados.mensagem}\n\n` +
            `Nome: ${nome}\n` +
            `Usuário: ${usuario}\n` +
            `Empresa: ${campoEmpresa.selectedOptions[0].text}\n` +
            `Setor: ${campoSetor.selectedOptions[0].text}\n` +
            `Sigla: ${sigla}\n\n` +
            `Confirma as informações e deseja voltar ao painel administrativo?`
        );

        if (confirmar) {
            window.location.href = "/admin";
        }

    } catch (erro) {
        console.error("Erro ao cadastrar usuário:", erro);
        alert("Não foi possível comunicar com o servidor.");
    }
});