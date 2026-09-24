console.log("🔥 CADASTRO.JS FOI CARREGADO!");
const formulario = document.getElementById("cadastroForm");

formulario.addEventListener("submit", async (event) => {

    event.preventDefault();

    console.log("🔥 FORMULÁRIO FOI ENVIADO!");

    const nome = document.getElementById("nome").value;
    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;
    const empresa = document.getElementById("empresa").value;
    const setor = document.getElementById("setor").value;
    const sigla = document.getElementById("sigla").value;

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

    console.log(dados);

});