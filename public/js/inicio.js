console.log("🔥 INICIO.JS ESTÁ FUNCIONANDO!");

const btnPublicar = document.getElementById("btnPublicar");
const campoConteudo = document.getElementById("conteudoPublicacao");

console.log("BOTÃO:", btnPublicar);
console.log("CAMPO:", campoConteudo);

btnPublicar.addEventListener("click", async () => {

    console.log("🔥 BOTÃO PUBLICAR FOI CLICADO!");

    const conteudo = campoConteudo.value.trim();

    if (conteudo === "") {
        alert("Digite um comunicado antes de publicar.");
        return;
    }

    const resposta = await fetch("/publicacoes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            conteudo: conteudo,
            tipo: "Aviso"
        })
    });

    const dados = await resposta.json();

    console.log("Resposta do servidor:", dados);

    if (dados.sucesso) {
        alert("Publicação realizada com sucesso!");
        campoConteudo.value = "";
    } else {
        alert(dados.mensagem);
    }
});