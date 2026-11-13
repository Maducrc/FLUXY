document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('formPendencia');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const botao = form.querySelector('button[type="submit"]');
            const textoOriginal = botao.innerHTML;
            botao.disabled = true;
            botao.innerHTML = 'Cadastrando...';

            try {
                const bloqueadas = Array.from(
                    form.querySelectorAll('input[name="bloqueadas"]:checked')
                ).map(cb => Number(cb.value));

                const dados = {
                    titulo: form.titulo.value.trim(),
                    descricao: form.descricao.value.trim(),
                    prazo: form.prazo.value,
                    impacto: Number(form.impacto.value),
                    bloqueadas: bloqueadas
                };

                const resposta = await fetch('/pendencias', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });

                const resultado = await resposta.json();

                if (!resposta.ok || !resultado.sucesso) {
                    throw new Error(resultado.mensagem || 'Erro ao cadastrar pendência.');
                }

                window.location.reload();
            } catch (erro) {
                alert(erro.message);
                botao.disabled = false;
                botao.innerHTML = textoOriginal;
            }
        });
    }

    document.querySelectorAll('.btn-resolver').forEach((botao) => {
        botao.addEventListener('click', async () => {
            if (botao.disabled) return;

            const id = botao.dataset.id;
            if (!confirm('Marcar esta pendência como resolvida?')) return;

            botao.disabled = true;

            try {
                const resposta = await fetch(`/pendencias/${id}/resolver`, {
                    method: 'PATCH'
                });
                const resultado = await resposta.json();

                if (!resposta.ok || !resultado.sucesso) {
                    if (resposta.status === 409 && resultado.bloqueadores && resultado.bloqueadores.length > 0) {
                        const lista = resultado.bloqueadores.map(t => `• ${t}`).join('\n');
                        alert(`⚠️ ${resultado.mensagem}\n\n${lista}`);
                    } else {
                        alert(resultado.mensagem || 'Erro ao resolver pendência.');
                    }
                    botao.disabled = false;
                    return;
                }

                window.location.reload();
            } catch (erro) {
                alert(erro.message);
                botao.disabled = false;
            }
        });
    });
});