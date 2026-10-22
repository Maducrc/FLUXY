document.addEventListener('DOMContentLoaded', function() {
    const calendario = document.getElementById('calendario');
    const modalNovo = new bootstrap.Modal(document.getElementById('novoEvento'));
    const modalVisualizar = new bootstrap.Modal(document.getElementById('modalVisualizarEvento'));

    let eventoEditandoId = null;

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
            eventoEditandoId = null;

            document.getElementById('formEvento').reset();
            document.querySelectorAll('.setor-checkbox').forEach(cb => cb.checked = false);
            document.querySelector('.modal-title').innerText = "Novo Evento"; 

            const dataInicioFormatada = info.dateStr + 'T09:00'; 
            const dataFimFormatada = info.dateStr + 'T10:00'; 

            document.getElementById('eventoDataInicio').value = dataInicioFormatada;
            document.getElementById('eventoDataFim').value = dataFimFormatada;

            document.getElementById('eventoTitulo').value = '';
            document.getElementById('eventoDescricao').value = '';
            
            modalNovo.show();
        },

        eventClick: function(info) {
            const evento = info.event;
            
            document.getElementById('vizTitulo').innerText = evento.title;
            document.getElementById('vizInicio').innerText = evento.start.toLocaleString('pt-BR');
            document.getElementById('vizFim').innerText = evento.end ? evento.end.toLocaleString('pt-BR') : 'Não definido';
            document.getElementById('vizDescricao').innerText = evento.extendedProps.descricao || 'Sem descrição.';

            document.getElementById('btnExcluirEvento').onclick = async () => {
                if (confirm("Tem certeza que deseja excluir este evento?")) {
                    try {
                        const resp = await fetch(`/eventos/${evento.id}`, { method: 'DELETE' });
                        const dados = await resp.json();
                        if (dados.sucesso) {
                            modalVisualizar.hide();
                            calendarioVizu.refetchEvents(); 
                        } else {
                            alert(dados.mensagem);
                        }
                    } catch (e) { alert("Erro ao excluir."); }
                }
            };

            document.getElementById('btnEditarEvento').onclick = () => {
                eventoEditandoId = evento.id;
                document.querySelector('.modal-title').innerText = "Editar Evento";

                document.getElementById('eventoTitulo').value = evento.title;
                document.getElementById('eventoDataInicio').value = evento.start.toISOString().slice(0, 16);
                document.getElementById('eventoDataFim').value = evento.end ? evento.end.toISOString().slice(0, 16) : '';
                document.getElementById('eventoDescricao').value = evento.extendedProps.descricao || '';

                document.querySelectorAll('.setor-checkbox').forEach(caixas => {
                    caixas.checked = evento.extendedProps.setores && evento.extendedProps.setores.includes(caixas.value);
                });

                modalVisualizar.hide(); 
                modalNovo.show();      
            };

            modalVisualizar.show(); 
        }
    });

    calendarioVizu.render();

    document.getElementById('fecharModal').addEventListener('click', function() {
        modalNovo.hide();
    });

    const botaoLimpar = document.getElementById('botaoLimpar');

    botaoLimpar.addEventListener("click", function() {
        document.getElementById('formEvento').reset();

        document.querySelectorAll('.setor-checkbox').forEach(function(checkbox) {
            checkbox.checked = false;
        });
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
                modalNovo.hide();
                calendarioVizu.refetchEvents(); 
                document.querySelectorAll('.setor-checkbox').forEach(caixas => caixas.checked = false);
            } else {
                alert(dados.mensagem);
            }
        } catch (erro) {
            console.error("Erro ao salvar evento:", erro);
            alert("Erro ao conectar com o servidor.");
        }
    });
});