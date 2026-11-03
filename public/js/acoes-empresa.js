let empresaEditandoId = null;

async function abrirModalEditar(botao) {
    const id = botao.dataset.id; 
    empresaEditandoId = id;
    
    const resposta = await fetch(`/empresas/${id}/detalhes`);
    const dados = await resposta.json();

    document.getElementById('editNomeEmpresa').value = dados.empresa;
    
    // Preenche Setores
    const listaSetores = document.getElementById('listaSetoresModal');
    listaSetores.innerHTML = dados.setores.length ? '' : '<li class="list-group-item text-muted">Nenhum setor</li>';
    dados.setores.forEach(s => {
        listaSetores.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center px-0">${s.setor} <a href="/cadastro-setor" class="btn btn-sm btn-outline-secondary">Ir para Setores</a></li>`;
    });

    // Preenche Funcionários
    const listaFunc = document.getElementById('listaFuncionariosModal');
    listaFunc.innerHTML = dados.usuarios.length ? '' : '<li class="list-group-item text-muted">Nenhum funcionário</li>';
    dados.usuarios.forEach(u => {
        listaFunc.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center px-0"><div><strong>${u.nome}</strong><br><small class="text-muted">${u.perfil}</small></div><a href="/cadastro" class="btn btn-sm btn-outline-secondary">Ir para Usuários</a></li>`;
    });

    new bootstrap.Modal(document.getElementById('modalEditarEmpresa')).show();
}

async function salvarNomeEmpresa() {
    const novoNome = document.getElementById('editNomeEmpresa').value;
    if (!novoNome) return alert("O nome não pode ficar vazio.");

    const resp = await fetch(`/empresas/${empresaEditandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa: novoNome })
    });
    const dados = await resp.json();
    
    if(dados.sucesso) { alert("Nome atualizado!"); location.reload(); } 
    else { alert("Erro: " + dados.mensagem); }
}

async function excluirEmpresa(botao) {
    const id = botao.dataset.id;
    const nome = botao.dataset.nome;

    if (confirm(`Tem certeza que deseja excluir a empresa "${nome}"?\n\nAtenção: Todos os setores e usuários vinculados a ela também serão excluídos!`)) {
        const resp = await fetch(`/empresas/${id}`, {method: 'DELETE'});
        const dados = await resp.json();
        
        if (dados.sucesso) { alert("Empresa excluída!"); location.reload(); } 
        else { alert("Erro: " + dados.mensagem); }
    }
}