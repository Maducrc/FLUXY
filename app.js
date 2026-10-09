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

function verificarAdm(req, res, next) {

    if(!req.session.usuario) {
        return res.redirect("/");
    }

    if(req.session.usuario.perfil !== "administrador") {
        return res.status(403).send("Acesso não autorizado.");
    }

    next()
}

app.get("/admin-teste", verificarAdm, (req, res) => {
    res.send("Área administrativa autorizada!");
});

app.get("/cadastro", (req, res) => {

    const sql  = "SELECT * FROM empresas";

    db.query(sql, (erro, empresas) => {
        
        if(erro) {
            console.log("Erro ao buscar empresas:", erro);
            return res.status(500).send("Erro ao carregar empresas.");
        }

        res.render("cadastro", {
            empresas: empresas
        });
    });
});

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/empresas/:id/setores", verificarAdm, (req, res) => {

    console.log("ROTA DE SETORES ACIONADA!");
    console.log("ID da empresa:", req.params.id);
    
    const empresaId = req.params.id;

    const sql = `
        SELECT id, setor
        FROM setores
        WHERE empresa_id = ?
        ORDER BY setor ASC
    `;

    db.query(sql, [empresaId], (erro, resultados) => {
        if(erro) {
            console.error("Erro ao buscar setores:", erro);
            
            return res.status(500).json ({
                sucesso: false,
                mensagem: "Erro ao buscar setores."
            });
        }

        res.json ({
            sucesso: true,
            setores: resultados
        });
    });
});

//Cadastro "Postando"
app.post("/cadastro", async (req, res) =>{

    const {
        nome, 
        usuario,
        senha, 
        empresa, 
        setor,
        sigla
    } = req.body;

    console.log("DADOS RECEBIDOS NO CADASTRO:");
    console.log("Nome:", nome);
    console.log("Usuário:", usuario);
    console.log("Senha:", senha);
    console.log("Sigla:", sigla);
    console.log("Empresa:", empresa);
    console.log("Setor:", setor);

    try {

        const sqlValidarSetor = `
            SELECT id
            FROM setores
            WHERE id = ? AND empresa_id = ?
        `;

        const setoresValidos = await new Promise((resolve, reject) => {
            db.query(
                sqlValidarSetor,
                [setor, empresa],
                (erro, resultados) => {
                    if (erro) return reject(erro);
                    resolve(resultados);
                }
            );
        });

        if (setoresValidos.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "O setor selecionado não pertence à empresa informada."
            });
        }

        //Criptografia Hash
        const senhaHash = await bcrypt.hash(senha, 10);

        const sql = `
            INSERT INTO usuarios 
            (nome, usuario, senha, empresa_id, setor_id, sigla)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql, 
            [nome, usuario, senhaHash, empresa, setor, sigla],
            (erro, resultado) => {

                if(erro) {
                  console.error("ERRO COMPLETO DO MYSQL:");
                  console.error(erro);

                  return res.status(500).json({
                        sucesso: false,
                        mensagem: erro.message
                    });
                }

                res.json({
                    sucesso: true, 
                    mensagem: "Usuário cadastrado com sucesso!"
                });
            }
        ); 
    } 

    catch (erro) {

        console.error("Erro ao criptografar senha:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno do servidor."
        });
    }
});

app.post("/publicacoes", (req, res) => {

    const { conteudo, tipo } = req.body;

    const usuarioId = req.session.usuario.id;

    const sql = `
        INSERT INTO publicacoes
        (usuario_id, conteudo, tipo)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [usuarioId, conteudo, tipo],
        (erro, resultado) => {

            if (erro) {
                console.error("Erro ao criar publicação:", erro);

                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Erro ao publicar."
                });
            }

            res.json({
                sucesso: true,
                mensagem: "Publicação criada com sucesso!"
            });
        }
    );
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
                setor_id: usuarioBanco.setor_id,
                perfil: usuarioBanco.perfil
            };

            return res.json({
                sucesso: true, 
                mensagem: "Login Realizado com Sucesso",
                perfil: usuarioBanco.perfil
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
            return res.status(500).send("Erro ao buscar setor.");
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

app.get("/cadastro-empresa", verificarAdm, (req, res) => {
    res.render("cadastro-empresa");
});

app.post("/cadastro-empresa", verificarAdm, (req, res) => {

    const { empresa, setores } = req.body;

    console.log("POST RECEBIDO!");
    console.log("Empresa:", empresa);
    console.log("Setores:", setores);

    const sql = "INSERT INTO empresas (empresa) VALUES (?)";

    db.query(sql, [empresa], (erro, resultado) => {

        if (erro) {
            console.error("ERRO AO CADASTRAR EMPRESA:");
            console.error(erro);

            return res.status(500).json({
                sucesso: false,
                mensagem: erro.message
            });
        }

        console.log("Empresa cadastrada!");
        console.log("ID da empresa:", resultado.insertId);

       //Setores
       const empresaId = resultado.insertId;
       
       const sqlSetor = `
        INSERT INTO setores (setor, empresa_id)
        VALUES (?, ?)
       `;

       let setoresCadastrados = 0; 

       setores.forEach((nomeSetor) => {
        
            db.query(
                sqlSetor, 
                [nomeSetor, empresaId],
                (erroSetor) => {

                    if(erroSetor) {
                        console.error("Erro ao cadastrar setor", erroSetor);
                        return;
                    }

                    setoresCadastrados++;

                    console.log(
                        `Setor Cadastrado: ${nomeSetor}`
                    );

                    if(setoresCadastrados === setores.length) {
                        res.json({
                            sucesso: true, 
                            mensagem: "Empresa e setores cadastrados com sucesso!",
                            empresa_id: empresaId
                        });
                    }

                }
            );
       });

    });

});

app.get("/admin", verificarAdm, (req, res) => {
   
    const sqlEmpresas = "SELECT COUNT(*) AS total FROM empresas";
    const sqlSetores = "SELECT COUNT(*) AS total FROM setores";

    const sqlListaEmpresas = `
        SELECT
            e.id,
            e.empresa,
            COUNT(DISTINCT s.id) AS total_setores,
            COUNT(DISTINCT u.id) AS total_usuarios
        FROM empresas e
        LEFT JOIN setores s ON s.empresa_id = e.id
        LEFT JOIN usuarios u ON u.empresa_id = e.id
        GROUP BY e.id, e.empresa
        ORDER BY e.empresa ASC
    `;

    db.query(sqlEmpresas, (erroEmpresas, resultadoEmpresas) => {

        if(erroEmpresas) {
            console.error("Erro ao constar empresas:", erroEmpresas);
            return res.status(500).send("Erro ao carregar dados no painel.");
        }

        db.query(sqlSetores, (erroSetores, resultadoSetores) => {

            if(erroSetores) {
                console.error("Erro ao contar setores", erroSetores);
                return res.status(500).send("Erro ao carregadar dados no painel.");
            }

            db.query(sqlListaEmpresas, (erroLista, resultadoLista) => {
                if(erroLista) {
                    console.error("Erro ao listar empresas:", erroLista);
                    return res.status(500).send("Erro ao carregar empresas.");
                }

                res.render("admin", {
                    usuario: req.session.usuario,
                    totalEmpresas: resultadoEmpresas[0].total,
                    totalSetores: resultadoSetores[0].total,
                    empresas: resultadoLista
                });
            });

        });

    });

});

