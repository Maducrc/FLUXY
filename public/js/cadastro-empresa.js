const formulario = document.getElementById("cadastroEmpresaForm");

formulario.addEventListener("submit", async (event) => {

    event.preventDefault();

    const nomeEmpresa = document.getElementById("empresa").value;

    console.log("Empresa", nomeEmpresa);

    try {
        const resposta = await fetch("/cadastro-empresa", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                empresa: nomeEmpresa
            })
        });

        const dados = await resposta.json();

        console.log("Resposta do Servidor:", dados);

        if (dados.sucesso) {

            const confirmar = window.confirm(
                `${dados.mensagem}\n\n` +
                `Empresa: ${nomeEmpresa}\n` +
                `Confirma as informações e deseja voltar ao painel administrativo?`
            );

            if (confirmar) {
                window.location.href = "/admin";
            }
        } 
        
        else {
            alert(`Não foi possível cadastrar a empresa: ${dados.mensagem}`);
        }
    }

    catch (erro){
        console.error("Erro no fetch:", erro);
    }

});