document.getElementById('formSetor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const empresa_id = document.getElementById('selectEmpresa').value;
    const setor = document.getElementById('inputSetor').value;

    const resp = await fetch('/cadastro-setor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id, setor })
    });
    const dados = await resp.json();
            
    if (dados.sucesso) { alert(dados.mensagem); location.reload(); } 
    else { alert("Erro: " + dados.mensagem); }
});