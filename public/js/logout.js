
document.addEventListener("DOMContentLoaded", () => {
    const btnLogout = document.getElementById("btnLogout");

    const modalFluxy = document.getElementById("modalFluxy");
    const modalFluxyCaixa = modalFluxy?.querySelector(".modal-fluxy");
    const modalFluxyIcone = document.getElementById("modalFluxyIcone");
    const modalFluxyTitulo = document.getElementById("modalFluxyTitulo");
    const modalFluxyMensagem = document.getElementById("modalFluxyMensagem");
    const modalFluxyConfirmar = document.getElementById("modalFluxyConfirmar");
    const modalFluxyCancelar = document.getElementById("modalFluxyCancelar");

    if (
        !btnLogout ||
        !modalFluxy ||
        !modalFluxyCaixa ||
        !modalFluxyIcone ||
        !modalFluxyTitulo ||
        !modalFluxyMensagem ||
        !modalFluxyConfirmar ||
        !modalFluxyCancelar
    ) {
        console.error("Não foi possível encontrar o link de logout ou os elementos do modal.");
        return;
    }

    function fecharModal() {
        modalFluxy.hidden = true;
    }

    function confirmarLogout() {
        modalFluxyCaixa.className = "modal-fluxy confirmacao";
        modalFluxyTitulo.textContent = "Deseja sair?";
        modalFluxyMensagem.textContent =
            "Tem certeza de que deseja encerrar sua sessão no Fluxy?";

        modalFluxyIcone.replaceChildren();

        const icone = document.createElement("i");
        icone.className = "bi bi-question-circle";
        modalFluxyIcone.appendChild(icone);

        modalFluxyCancelar.hidden = false;
        modalFluxyConfirmar.textContent = "Sair";
        modalFluxy.hidden = false;

        return new Promise((resolve) => {
            modalFluxyConfirmar.onclick = () => {
                fecharModal();
                resolve(true);
            };

            modalFluxyCancelar.onclick = () => {
                fecharModal();
                resolve(false);
            };

            modalFluxyConfirmar.focus();
        });
    }

    btnLogout.addEventListener("click", async (evento) => {
        evento.preventDefault();

        const confirmou = await confirmarLogout();

        if (confirmou) {
            window.location.href = btnLogout.href;
        }
    });
});
