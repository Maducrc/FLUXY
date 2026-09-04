//requires
const express = require("express");
const db = require("./config/database");
const bcrypt = require("bcrypt");
const session = require("express-session");

//fixo
const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));  

app.use(express.static("public"));
app.use(express.json());

app.use(session ({
    secret: "fluxy-segredo",
    resave: false, 
    saveUninitialized: false
}));

function verificarLogin(req, res, next) {
    if(!req.session.usuario) {
        return res.redirect("/");
    }

    next()
}

app.get("/cadastro", (req, res) => {
    res.render("cadastro");
    console.log("tela de casdatro funcionando");
});

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
            console.error(  erro);

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

            req.session.usuario = {
                id: usuarioBanco.id,
                nome: usuarioBanco.nome,
                usuario: usuarioBanco.usuario,
                empresa_id: usuarioBanco.empresa_id,
                setor_id: usuarioBanco.setor_id
            };

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

//Provisório
app.get("/dashboard", verificarLogin, (req, res) => {

    const usuarioId = req.session.usuario.id;   

    const sql = `
    SELECT 
        usuarios.id,
        usuarios.nome,
        usuarios.usuario,
        usuarios.sigla,
        empresas.empresa AS empresa,
        setores.setor AS setor
    FROM usuarios
    LEFT JOIN empresas 
        ON usuarios.empresa_id = empresas.id
    LEFT JOIN setores 
        ON usuarios.setor_id = setores.id
    WHERE usuarios.id = ?;
    `;

    db.query(sql, [usuarioId], (erro, resultados) => {

        if(erro) {
            console.error("Erro ao buscar informações no banco de dados!", erro);
            return res.status(500).send("Erro ao carregar dashboard");
        }

        if(resultados.length === 0) {
            return res.status(404).send("Usuário não encontrado.");
        }

        const dadosUsuario = resultados[0];

        res.render("dashboard", {
            usuario: dadosUsuario
        });

    });

});

app.get("/setor/:nome", verificarLogin, (req, res) => {

    const setorNome = req.params.nome;

    const sql = `
        SELECT * FROM setores WHERE LOWER(setor) = LOWER(?) 
    `;

    db.query(sql, [setorNome], (erro, resultados) => {

        if(erro) {
            console.error("Erro ao buscar setor: ", erro);
            return req.status(500).send("Erro ao buscar setor.");
        }

        if(resultados.length === 0) {
            return res.status(404).send("Setor não encontrado.");
        }

        const setor = resultados[0];
if (setor.id !== req.session.usuario.setor_id) {

    return res.status(403).send(
        "Você não tem acesso a este setor."
    );

}

res.render("setor", {
    usuario: req.session.usuario,
    setor: setor
});

    });

});

//Provisório
app.get("/usuario-logado", (req, res) => {

    if (!req.session.usuario) {
        return res.json({
            logado: false
        });
    }

    res.json({
        logado: true, 
        usuario: req.session.usuario
    });

});

app.listen(3000, () => {
    console.log("Servidor Rodando em http://localhost:3000");
});