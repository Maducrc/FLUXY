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
        sigla,
        perfil
    } = req.body;

    console.log("DADOS RECEBIDOS NO CADASTRO:");
    console.log("Nome:", nome);
    console.log("Usuário:", usuario);
    console.log("Senha:", senha);
    console.log("Sigla:", sigla);
    console.log("Setor:", setor);
    console.log("Empresa:", empresa);

    if (!nome || !usuario || !senha || !sigla || !perfil) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Preencha todos os campos."
        });
    }

    const perfisValidos = ["administrador", "admin_empresa", "funcionario"];

    if (!perfisValidos.includes(perfil)) {
        return res.status(400).json({
        sucesso: false,
        mensagem: "Perfil inválido."
        });
    }

    try {

        let empresaFinal = null;
        let setorFinal = null;

        if (perfil === "admin_empresa") {
            if (!empresa) {
                return res.status(400).json({ 
                    sucesso: false, 
                    mensagem: "Empresa é obrigatória para este perfil." 
                });
            }
            empresaFinal = empresa;
        } 
        else if (perfil === "funcionario") {
            if (!empresa || !setor) {
                return res.status(400).json({ 
                    sucesso: false, 
                    mensagem: "Empresa e setor são obrigatórios para este perfil." 
                });
            }

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
            empresaFinal = empresa;
            setorFinal = setor;
        }

        //Criptografia Hash
        const senhaHash = await bcrypt.hash(senha, 10);

        const sql = `
            INSERT INTO usuarios 
            (nome, usuario, senha, empresa_id, setor_id, sigla, perfil)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql, 
            [nome, usuario, senhaHash, empresaFinal, setorFinal, sigla, perfil],
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

    const tiposPermitidos = [
        "Aviso",
        "Agendamento",
        "Comunicado",
        "Atualização"
    ];

    if (!conteudo || !conteudo.trim()) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "O conteúdo da publicação é obrigatório."
        });
    }

    if (!tiposPermitidos.includes(tipo)) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Categoria inválida."
        });
    }

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

app.get("/publicacoes", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Usuário não autenticado."
        });
    }

    const empresaId = req.session.usuario.empresa_id;

    const { setorId, tipo } = req.query;

    let sql = `
        SELECT
            p.id,
            p.usuario_id,
            p.conteudo,
            p.tipo,
            p.criado_em,
            u.nome AS autor_nome,
            u.sigla,
            u.setor_id,
            s.setor AS setor_nome
        FROM publicacoes p
        INNER JOIN usuarios u ON p.usuario_id = u.id
        INNER JOIN setores s ON u.setor_id = s.id
        WHERE u.empresa_id = ?
    `;

    const parametros = [empresaId];

    if (setorId && setorId !== "todos") {
        sql += " AND u.setor_id = ?";
        parametros.push(Number(setorId));
    }

    if (tipo && tipo !== "todos") {
        sql += " AND p.tipo = ?";
        parametros.push(tipo);
    }

    sql += " ORDER BY p.criado_em DESC";

    db.query(sql, parametros, (erro, resultados) => {
        if (erro) {
            console.error("Erro ao buscar publicações:", erro);

            return res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao carregar publicações."
            });
        }

        res.json({
            sucesso: true,
            publicacoes: resultados
        });
    });
});

app.put("/publicacoes/:id", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Faça login para continuar."
        });
    }

    const publicacaoId = Number(req.params.id);
    const usuarioId = req.session.usuario.id;
    const { conteudo, tipo } = req.body;

    const tiposPermitidos = [
        "Aviso",
        "Agendamento",
        "Comunicado",
        "Atualização"
    ];

    if (!Number.isInteger(publicacaoId) || publicacaoId <= 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Publicação inválida."
        });
    }

    if (typeof conteudo !== "string" || !conteudo.trim()) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "O conteúdo não pode ficar vazio."
        });
    }

    if (!tiposPermitidos.includes(tipo)) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Categoria inválida."
        });
    }

    const sql = `
        UPDATE publicacoes
        SET conteudo = ?, tipo = ?
        WHERE id = ? AND usuario_id = ?
    `;

    db.query(
        sql,
        [conteudo.trim(), tipo, publicacaoId, usuarioId],
        (erro, resultado) => {
            if (erro) {
                console.error("Erro ao editar publicação:", erro);

                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Erro ao editar publicação."
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: "Publicação não encontrada ou você não tem permissão para editá-la."
                });
            }

            res.json({
                sucesso: true,
                mensagem: "Publicação atualizada com sucesso!"
            });
        }
    );
});

app.delete("/publicacoes/:id", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Faça login para continuar."
        });
    }

    const publicacaoId = Number(req.params.id);
    const usuarioId = req.session.usuario.id;

    if (!Number.isInteger(publicacaoId) || publicacaoId <= 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Publicação inválida."
        });
    }

    const sql = `
        DELETE FROM publicacoes
        WHERE id = ? AND usuario_id = ?
    `;

    db.query(
        sql,
        [publicacaoId, usuarioId],
        (erro, resultado) => {
            if (erro) {
                console.error("Erro ao excluir publicação:", erro);

                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Erro ao excluir publicação."
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: "Publicação não encontrada ou você não tem permissão para excluí-la."
                });
            }

            res.json({
                sucesso: true,
                mensagem: "Publicação excluída com sucesso!"
            });
        }
    );
});

app.get("/setores-empresa", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Usuário não autenticado."
        });
    }

    const empresaId = req.session.usuario.empresa_id;

    const sql = `
        SELECT id, setor
        FROM setores
        WHERE empresa_id = ?
        ORDER BY setor ASC
    `;

    db.query(sql, [empresaId], (erro, resultados) => {
        if (erro) {
            console.error("Erro ao buscar setores:", erro);

            return res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao carregar setores."
            });
        }

        res.json({
            sucesso: true,
            setores: resultados
        });
    });
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
                sigla: usuarioBanco.sigla,  
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
    if (req.session.usuario.perfil === 'administrador') {
        return res.redirect("/admin");
    }

    const usuarioId = req.session.usuario.id;   

    const sql = `
    SELECT 
        usuarios.id,
        usuarios.nome,
        usuarios.usuario,
        usuarios.sigla,
        usuarios.perfil,
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

app.get("/calendario", verificarLogin, (req, res) => {
    if (req.session.usuario.perfil === 'administrador') {
        return res.redirect("/admin");
    }
    const usuarioId = req.session.usuario.id;
    const perfil = req.session.usuario.perfil;

    const sqlUsuario = `
        SELECT usuarios.*, empresas.empresa AS empresa, setores.setor AS setor
        FROM usuarios
        LEFT JOIN empresas ON usuarios.empresa_id = empresas.id
        LEFT JOIN setores ON usuarios.setor_id = setores.id
        WHERE usuarios.id = ?
    `;

    db.query(sqlUsuario, [usuarioId], (erro, resultados) => {
        if (erro || resultados.length === 0) return res.redirect("/logout");
        const dadosUsuario = resultados[0];

        let sqlSetores = "SELECT id, setor FROM setores WHERE empresa_id = ?";
        let paramsSetores = [dadosUsuario.empresa_id];

        db.query(sqlSetores, paramsSetores, (erroSetores, setores) => {
            if (erroSetores) {
                console.error("Erro ao buscar setores:", erroSetores);
                return res.status(500).send("Erro ao carregar setores.");
            }
            res.render("calendario", {
                usuario: dadosUsuario,
                setores: setores,
                perfil: perfil
            });
        });
    });
});

app.get("/eventos", verificarLogin, (req, res) => {
    const empresaId = req.session.usuario.empresa_id;
    const setorId = req.session.usuario.setor_id;
    const usuarioId = req.session.usuario.id;
    const perfil = req.session.usuario.perfil;
    
    let sql;
    let params = [];

    if (perfil === 'admin_empresa') {
        sql = `
            SELECT e.id, e.titulo AS title, REPLACE(e.data_inicio, ' ', 'T') AS start, REPLACE(e.data_fim, ' ', 'T') AS end, 
            e.descricao, e.usuario_id,
            (SELECT GROUP_CONCAT(setor_id) FROM eventos_setores WHERE evento_id = e.id) as setores_ids
            FROM eventos e WHERE e.empresa_id = ?
        `;
        params = [empresaId];
    } else {
        sql = `
            SELECT DISTINCT e.id, e.titulo AS title, REPLACE(e.data_inicio, ' ', 'T') AS start, REPLACE(e.data_fim, ' ', 'T') AS end, 
            e.descricao, e.usuario_id,
            (SELECT GROUP_CONCAT(setor_id) FROM eventos_setores WHERE evento_id = e.id) as setores_ids
            FROM eventos e
            WHERE e.empresa_id = ? 
            AND (
                e.usuario_id = ? 
                OR e.id IN (SELECT evento_id FROM eventos_setores WHERE setor_id = ?)
                OR e.id NOT IN (SELECT evento_id FROM eventos_setores)
            )
        `;
        params = [empresaId, usuarioId, setorId];
    }
    
    db.query(sql, params, (erro, resultados) => {
        if (erro) return res.status(500).json({ erro: "Erro ao buscar eventos" });

        const eventosFormatados = resultados.map(evento => ({
            id: evento.id,
            title: evento.title,
            start: evento.start,
            end: evento.end,
            extendedProps: {
                descricao: evento.descricao,
                usuario_id: evento.usuario_id,
                setores: evento.setores_ids ? evento.setores_ids.split(',') : []
            }
        }));
        
        res.json(eventosFormatados);
    });
});

app.post("/eventos", verificarLogin, (req, res) => {
    const { titulo, data_inicio, data_fim, descricao, setores } = req.body;
    const usuarioId = req.session.usuario.id;
    const empresaId = req.session.usuario.empresa_id;
    const setorUsuarioLogado = req.session.usuario.setor_id;
    const perfil = req.session.usuario.perfil;

    if (!titulo || !data_inicio || !data_fim) {
        return res.status(400).json({ sucesso: false, mensagem: "Preencha o título e a data." });
    }

    let setoresEscolhidos = setores || [];
    if (perfil === 'funcionario' && setoresEscolhidos.length === 0) {
        setoresEscolhidos.push(setorUsuarioLogado);
    }

    const sqlEvento = `
        INSERT INTO eventos 
        (usuario_id, empresa_id, titulo, data_inicio, data_fim, descricao) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sqlEvento, [usuarioId, empresaId, titulo, data_inicio, data_fim, descricao], (erro, resultado) => {
        if (erro) {
            console.error("Erro ao salvar evento:", erro);
            return res.status(500).json({ sucesso: false, mensagem: "Erro ao salvar evento." });
        }

        const eventoId = resultado.insertId;

        if (setoresEscolhidos.length > 0) {
            const sqlSetores = "INSERT INTO eventos_setores (evento_id, setor_id) VALUES ?";
            const valores = setoresEscolhidos.map(setorId => [eventoId, setorId]);

            db.query(sqlSetores, [valores], (erroSetores) => {
                if (erroSetores) {
                    console.error("Erro ao vincular setores ao evento:", erroSetores);
                    return res.status(500).json({ sucesso: false, mensagem: "Evento criado, mas erro ao vincular setores." });
                }
                res.json({ sucesso: true });
            });
        } else {
            res.json({ sucesso: true });
        }
    });
});

// excluir
app.delete("/eventos/:id", verificarLogin, (req, res) => {
    const eventoId = req.params.id;
    const usuarioId = req.session.usuario.id;
    const perfil = req.session.usuario.perfil;

    const sqlVerifica = "SELECT usuario_id FROM eventos WHERE id = ?";
    db.query(sqlVerifica, [eventoId], (erro, resultados) => {
        if (erro || resultados.length === 0) return res.status(404).json({ sucesso: false, mensagem: "Evento não encontrado." });

        if (perfil !== 'admin_empresa' && resultados[0].usuario_id !== usuarioId) {
            return res.status(403).json({ sucesso: false, mensagem: "Você não tem permissão para excluir este evento." });
        }

        const sqlDelete = "DELETE FROM eventos WHERE id = ?";
        db.query(sqlDelete, [eventoId], (erroDelete) => {
            if (erroDelete) return res.status(500).json({ sucesso: false, mensagem: "Erro ao excluir." });
            res.json({ sucesso: true });
        });
    });
});

// alterar
app.put("/eventos/:id", verificarLogin, (req, res) => {
    const eventoId = req.params.id;
    const { titulo, data_inicio, data_fim, descricao, setores } = req.body;
    const usuarioId = req.session.usuario.id;
    const perfil = req.session.usuario.perfil;

    const sqlVerifica = "SELECT usuario_id FROM eventos WHERE id = ?";
    db.query(sqlVerifica, [eventoId], (erro, resultados) => {
        if (erro || resultados.length === 0) return res.status(404).json({ sucesso: false });

        if (perfil !== 'admin_empresa' && resultados[0].usuario_id !== usuarioId) {
            return res.status(403).json({ sucesso: false, mensagem: "Sem permissão para alterar." });
        }

        const sqlUpdate = "UPDATE eventos SET titulo = ?, data_inicio = ?, data_fim = ?, descricao = ? WHERE id = ?";
        db.query(sqlUpdate, [titulo, data_inicio, data_fim, descricao, eventoId], (erroUpdate) => {
            if (erroUpdate) return res.status(500).json({ sucesso: false });

            db.query("DELETE FROM eventos_setores WHERE evento_id = ?", [eventoId], () => {
                if (setores && setores.length > 0) {
                    const valores = setores.map(setorId => [eventoId, setorId]);
                    db.query("INSERT INTO eventos_setores (evento_id, setor_id) VALUES ?", [valores], () => {
                        res.json({ sucesso: true });
                    });
                } else {
                    res.json({ sucesso: true });
                }
            });
        });
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});