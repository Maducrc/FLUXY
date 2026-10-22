
document.addEventListener("DOMContentLoaded", async () => {
    console.log("1. JavaScript da Agenda Geral carregado.");

    const listaAgenda = document.getElementById("listaAgendaGeral");

    console.log("2. Elemento da agenda:", listaAgenda);

    if (!listaAgenda) {
        console.error("O elemento listaAgendaGeral não foi encontrado no HTML.");
        return;
    }

    try {
        console.log("3. Buscando /agenda-geral...");

        const resposta = await fetch("/agenda-geral");

        console.log("4. Status da resposta:", resposta.status);

        const dados = await resposta.json();

        console.log("5. Eventos recebidos:", dados);

        listaAgenda.replaceChildren();

        if (!Array.isArray(dados) || dados.length === 0) {
            listaAgenda.textContent = "Nenhum próximo evento.";
            return;
        }

        dados.forEach((evento) => {
            const item = document.createElement("div");
            item.classList.add("agenda-evento");

            const titulo = document.createElement("strong");
            titulo.textContent = evento.title || evento.titulo || "Evento sem título";

            const data = document.createElement("p");
            const dataEvento = evento.start || evento.data_inicio;

            data.textContent = dataEvento
                ? new Date(dataEvento).toLocaleString("pt-BR")
                : "Data não informada";

            item.append(titulo, data);
            listaAgenda.appendChild(item);
        });

    } catch (erro) {
        console.error("Erro ao carregar a Agenda Geral:", erro);
        listaAgenda.textContent = "Não foi possível carregar os eventos.";
    }
});
