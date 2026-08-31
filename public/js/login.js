const usuario = document.getElementById("usuario"); 

usuario.addEventListener("input", () => {
    console.log(usuario.value);
});


const senha = document.getElementById("senha");
const toggleSenha = document.getElementById("toggleSenha");

toggleSenha.addEventListener("click", () => {

    if(senha.type === "password") {
        senha.type = "text";
    }
    else {
        senha.type = "password";
    }

});

const formulario = document.getElementById("loginForm");

formulario.addEventListener("submit", async (event) => {

    event.preventDefault();

    const usuarioDigitado = usuario.value;
    const senhaDigitada = senha.value;

    if(usuarioDigitado === "" || senhaDigitada === "") {
        console.log("Preencha todos os campos!");
        return;
    }

    const resposta = await fetch("/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            usuario: usuarioDigitado,
            senha: senhaDigitada
        })
    });

    const dados = await resposta.json();

    if(dados.sucesso) {
        mensagem.textContent = dados.mensagem;
    }

    else {
        mensagem.textContent = dados.mensagem;
    }
});

const mensagem = document.getElementById("mensagem");