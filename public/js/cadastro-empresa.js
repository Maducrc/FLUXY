const listaSetores = document.getElementById("listaSetores");
const adicionarSetor = document.getElementById("adicionarSetor");

adicionarSetor.addEventListener("click", () => {

    const novoSetor = document.createElement("div");

    novoSetor.classList.add("setor-item");

    novoSetor.innerHTML = `
        <input type="text" name="setor" placeholder="digite o nome do setor">        
        <button type="button" class="remover-setor">Remover</button>
    `;

    listaSetores.appendChild(novoSetor);
});

listaSetores.addEventListener("click", (event) => {

    if (event.target.classList.contains("remover-setor")) {

        const setor = event.target.parentElement;

        setor.remove();

    }

});

const formulario = document.getElementById("cadastroEmpresaForm");

formulario.addEventListener("submit", async (event) => {

    event.preventDefault();

    const nomeEmpresa = document.getElementById("empresa").value;
    const camposSetor = document.querySelectorAll('input[name="setor"]');
    const setores = [];

    camposSetor.forEach((campo) => {
        
        const nomeSetor = campo.value.trim();

        if(nomeSetor !== "") {
            setores.push(nomeSetor);
        }

    });

    console.log("Empresa", nomeEmpresa);
    console.log("Setores:", setores);

    try {
        const resposta = await fetch("/cadastro-empresa", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                empresa: nomeEmpresa,
                setores: setores
            })
        });

        const dados = await resposta.json();

        console.log("Resposta do Servidor:", dados);

        if (dados.sucesso) {
            const resumoSetores = setores.join(", ");

            const confirmar = window.confirm(
                `${dados.mensagem}\n\n` +
                `Empresa: ${nomeEmpresa}\n` +
                `Setores: ${resumoSetores}\n\n` +
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