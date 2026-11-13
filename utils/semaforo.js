function calcularSemaforo(pendencia) {
    const prazoOriginal = new Date(pendencia.prazo);
    const prazo = new Date(
        prazoOriginal.getUTCFullYear(),
        prazoOriginal.getUTCMonth(),
        prazoOriginal.getUTCDate()
    );

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diasRestantes = Math.round(
        (prazo - hoje) / (1000 * 60 * 60 * 24)
    );

    let notaPrazo;
    if (diasRestantes < 0) notaPrazo = 10;
    else if (diasRestantes <= 1) notaPrazo = 9;
    else if (diasRestantes <= 3) notaPrazo = 7;
    else if (diasRestantes <= 7) notaPrazo = 5;
    else if (diasRestantes <= 14) notaPrazo = 3;
    else notaPrazo = 1;

    const quantidade = Number(pendencia.bloqueadas_count);
    let notaBloqueio;
    if (quantidade === 0) notaBloqueio = 0;
    else if (quantidade === 1) notaBloqueio = 3;
    else if (quantidade <= 3) notaBloqueio = 6;
    else if (quantidade <= 5) notaBloqueio = 8;
    else notaBloqueio = 10;

    const impacto = Number(pendencia.impacto);

    const pontuacao =
        notaPrazo * 0.40 +
        impacto * 0.35 +
        notaBloqueio * 0.25;

    let cor, prioridade;
    if (pontuacao >= 7.5) {
        cor = 'vermelho';
        prioridade = 'Alta';
    } else if (pontuacao >= 4.5) {
        cor = 'amarelo';
        prioridade = 'Média';
    } else {
        cor = 'verde';
        prioridade = 'Baixa';
    }

    return {
        pontuacao: Number(pontuacao.toFixed(2)),
        cor,
        prioridade
    };
}

module.exports = calcularSemaforo;