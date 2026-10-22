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

            // Cartão do evento
            const item = document.createElement("div");
            item.classList.add("agenda-evento");

            // Data do evento
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

            // Informações do evento
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

            detalhes.append(titulo, horario);
            item.append(data, detalhes);
            listaAgenda.appendChild(item);
        });
    } catch (erro) {
        console.error("Erro na Agenda Geral:", erro);
        listaAgenda.textContent = "Não foi possível carregar os eventos.";
    }
});
