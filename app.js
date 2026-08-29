var app = require('./fluxy/config/express')();

app.listen(3000, function() {
    console.log("Servidor rodando na porta 3000");
    console.log("Acesse: http://localhost:3000/login");
});
