const bcrypt = require("bcrypt");
const { hash } = require("crypto");
const { hasUncaughtExceptionCaptureCallback } = require("process");

const senha = "123456";

bcrypt.hash(senha, 10, (erro, hash) => {

    if(erro) {
        console.error("Erro ao Gerar Hash: ", erro);
        return;
    }

    console.log("Hash da Senha:");
    console.log(hash);
})