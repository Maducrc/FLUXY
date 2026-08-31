//requires
const express = require("express");
const db = require("./config/database");
const bcrypt = require("bcrypt");

//fixo
const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));  

app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
    res.render("login");
});

//login lógica com senha hash 
app.post("/login", async (req, res) => {

    const usuario = req.body.usuario;
    const senha = req.body.senha;

    const sql = "SELECT * FROM usuarios WHERE usuario = ?"

    db.query(sql, [usuario], async (erro, resultados) => {
        
        if(erro) {
            console.error("Erro ao Encontrar Usuário:", erro);

            return res.status(500).json({
                sucesso: false, 
                mensagem: "Erro Interno do Servidor"
            });
        }

        if(resultados.length === 0) {

            return res.json({
                sucesso: false,
                mensagem: "Usuário ou Senha Incorretos!"
            });
        }

        const usuarioBanco = resultados[0];

        //aqui ele compara a senha colocada no login com o que está em hash no bd
        const senhaCorreta = await bcrypt.compare (
            senha, 
            usuarioBanco.senha
        );

        if(senhaCorreta) {

            return res.json({
                sucesso: true, 
                mensagem: "Login Realizado com Sucesso"
            });
        }

        else {

            return res.json({
                sucesso: false, 
                mensagem: "Usuário ou Senha Incorretos!"
            });
        }

    });

});

app.listen(3000, () => {
    console.log("Servidor Rodando em http://localhost:3000");
});