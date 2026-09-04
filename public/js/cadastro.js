const formulario = document.getElementById("cadastroForm");

formulario.addEventListener("submit", (event) => {

    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;
    const empresa = document.getElementById("empresa").value;
    const setor = document.getElementById("setor").value;
    const sigla = document.getElementById("sigla").value;

    console.log("Nome:", nome);
    console.log("Usuário:", usuario);
    console.log("Senha:", senha);
    console.log("Sigla:", sigla);
    console.log("Empresa:", empresa);
    console.log("Setor:", setor);

});