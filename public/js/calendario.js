document.addEventListener('DOMContentLoaded', function() {
    const calendario = document.getElementById('calendario');
    const evento = document.getElementById('novoEvento');
    const modal = new bootstrap.Modal(evento);

    const calendarioVizu = new FullCalendar.Calendar(calendario, {
        initialView: 'dayGridMonth', 
        locale: 'pt-br',             
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia'
        },
        
        events: '/eventos',

        dateClick: function(info) {
            const dataInicioFormatada = info.dateStr + 'T09:00'; 
            const dataFimFormatada = info.dateStr + 'T10:00'; 

            document.getElementById('eventoDataInicio').value = dataInicioFormatada;
            document.getElementById('eventoDataFim').value = dataFimFormatada;

            document.getElementById('eventoTitulo').value = '';
            document.getElementById('eventoDescricao').value = '';
            
            modal.show();
        }
    });

    calendarioVizu.render();

    document.getElementById('fecharModal').addEventListener('click', function() {
        modal.hide();
    });
    document.getElementById('botaoCancelar').addEventListener('click', function() {
        modal.hide();
    });

    document.getElementById('botaoSalvarEvento').addEventListener('click', async () => {
        const titulo = document.getElementById('eventoTitulo').value;
        const data_inicio = document.getElementById('eventoDataInicio').value;
        const data_fim = document.getElementById('eventoDataFim').value;
        const descricao = document.getElementById('eventoDescricao').value;

        const checkboxesMarcados = document.querySelectorAll('.setor-checkbox:checked');
    
        const setoresSelecionados = Array.from(checkboxesMarcados).map(checkbox => checkbox.value);

        if (!titulo || !data_inicio) {
            alert("Preencha o título e a data.");
            return;
        }

        try {
            const resposta = await fetch('/eventos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    titulo, 
                    data_inicio, 
                    data_fim, 
                    descricao, 
                    setores: setoresSelecionados 
                })
            });

            const dados = await resposta.json();

            if (dados.sucesso) {
                modal.hide();
                calendarioVizu.refetchEvents(); 
                document.querySelectorAll('.setor-checkbox').forEach(cb => cb.checked = false);
            } else {
                alert(dados.mensagem);
            }
        } catch (erro) {
            console.error("Erro ao salvar evento:", erro);
            alert("Erro ao conectar com o servidor.");
        }
    });
});