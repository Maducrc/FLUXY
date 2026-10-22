
document.addEventListener("DOMContentLoaded", async () => {
    const listaAgenda = document.getElementById("listaAgendaGeral");

    if (!listaAgenda) return;

    try {
        const resposta = await fetch("/agenda-geral");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os eventos.");
        }

        const eventos = await resposta.json();

        listaAgenda.replaceChildren();
        listaAgenda.classList.remove("agenda-vazia");

        if (eventos.length === 0) {
            listaAgenda.textContent = "Nenhum próximo evento.";
            listaAgenda.classList.add("agenda-vazia");
            return;
        }

        eventos.forEach((evento) => {
            const inicio = new Date(evento.start);
            const fim = new Date(evento.end);

            const item = document.createElement("div");
            item.classList.add("agenda-evento");

            const data = document.createElement("div");
            data.classList.add("agenda-evento-data");

            const dia = document.createElement("strong");
            dia.textContent = inicio.toLocaleDateString("pt-BR", {
                day: "2-digit"
            });

            const mes = document.createElement("span");
            mes.textContent = inicio
                .toLocaleDateString("pt-BR", { month: "short" })
                .replace(".", "")
                .toUpperCase();

            data.append(dia, mes);

            const detalhes = document.createElement("div");
            detalhes.classList.add("agenda-evento-detalhes");

            const titulo = document.createElement("strong");
            titulo.classList.add("agenda-evento-titulo");
            titulo.textContent = evento.title;

            const horario = document.createElement("span");
            horario.classList.add("agenda-evento-horario");
            horario.textContent =
                `${inicio.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit"
                })} – ${fim.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit"
                })}`;

            // Status de conclusão
            const status = document.createElement("span");
            status.classList.add("agenda-evento-status");

            // Botão de check
            const botaoConcluir = document.createElement("button");
            botaoConcluir.type = "button";
            botaoConcluir.classList.add("btn-concluir-agenda");

            function atualizarVisual(concluido) {
                status.textContent = concluido ? "Concluído" : "Pendente";

                status.classList.toggle("concluido", concluido);
                item.classList.toggle("evento-concluido", concluido);

                botaoConcluir.innerHTML = concluido
                    ? '<i class="bi bi-arrow-counterclockwise"></i>'
                    : '<i class="bi bi-check-lg"></i>';

                botaoConcluir.title = concluido
                    ? "Desmarcar conclusão"
                    : "Marcar como concluído";

                botaoConcluir.setAttribute(
                    "aria-label",
                    botaoConcluir.title
                );
            }

            atualizarVisual(Boolean(evento.concluido));

            botaoConcluir.addEventListener("click", async () => {
                const novoStatus = !Boolean(evento.concluido);

                botaoConcluir.disabled = true;

                try {
                    const resposta = await fetch(
                        `/eventos/${evento.id}/concluir`,
                        {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                concluido: novoStatus
                            })
                        }
                    );

                    const dados = await resposta.json();

                    if (!resposta.ok || !dados.sucesso) {
                        throw new Error(
                            dados.mensagem || "Não foi possível atualizar o evento."
                        );
                    }

                    evento.concluido = novoStatus;
                    atualizarVisual(novoStatus);

                } catch (erro) {
                    console.error("Erro ao concluir evento:", erro);
                    alert(erro.message || "Erro ao atualizar o evento.");
                } finally {
                    botaoConcluir.disabled = false;
                }
            });

            detalhes.append(titulo, horario, status);
            item.append(data, detalhes, botaoConcluir);
            listaAgenda.appendChild(item);
        });

    } 
    
    catch (erro) {
        console.error("Erro na Agenda Geral:", erro);
        listaAgenda.textContent = "Não foi possível carregar os eventos.";
    }
});
