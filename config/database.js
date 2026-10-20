const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root", 
    password: "",
    database: "fluxy"
});

connection.connect((erro) => {
    
    if(erro) {
        console.error("Erro ao Conectar ao MYSQL:", erro);
        return;
    }

    console.log("MySQL Conectado ao Node.js com Sucesso!");
});

module.exports = connection;