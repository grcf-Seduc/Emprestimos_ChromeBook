// =============================================================
// chromebooks.js — Lógica da página de Inventário
// Responsável por: cadastrar chromebooks no inventário,
// exibir a tabela com plaqueta/condição/status, atualizar os
// cards de resumo e gerenciar as ações de editar, colocar em
// manutenção e excluir.
//
// IMPORTANTE: o status "Emprestado" é derivado automaticamente
// consultando o localStorage de empréstimos (chave 'emprestimos').
// Isso significa que ao registrar um empréstimo em index.html,
// o inventário reflete o status correto sem precisar de
// nenhuma atualização manual.
// =============================================================


// ── Dados padrão do inventário ────────────────────────────────
// Lista inicial dos 16 Chromebooks do patrimônio.
// Carregada automaticamente na primeira vez que a página é aberta
// (quando o localStorage ainda não tem dados salvos).
// EST. CONS. 02 da planilha patrimonial = condição "Bom".
const CHROMEBOOKS_PADRAO = [
    { plaqueta: '557375', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557380', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557381', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557382', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557383', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557384', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557385', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557386', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557387', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557388', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557389', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557600', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557601', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557602', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557603', condicao: 'Bom', status: 'disponivel' },
    { plaqueta: '557604', condicao: 'Bom', status: 'disponivel' },
];


// ── Armazenamento em memória ──────────────────────────────────
// 'chromebooks' guarda o inventário (plaqueta, condição, status manual).
// 'emprestimos' é lido do localStorage para derivar o status real.
let chromebooks = [];
let emprestimos = [];


// ── Inicialização da página ───────────────────────────────────
// Aguarda o HTML estar pronto antes de tentar acessar os elementos.
document.addEventListener('DOMContentLoaded', () => {
    carregar();    // lê ambos os arrays do localStorage (ou semeia os padrões)
    renderizar();  // desenha a tabela e atualiza os cards de resumo
});


// ── Carregar dados do localStorage ───────────────────────────
// Lê as duas chaves independentes do localStorage:
//   'chromebooks' → inventário gerenciado por esta página
//   'emprestimos' → registros criados em index.html
//
// Se 'chromebooks' não existir ainda (primeira visita), semeia
// automaticamente com os 16 Chromebooks do patrimônio (CHROMEBOOKS_PADRAO).
function carregar() {
    const saved = localStorage.getItem('chromebooks');
    if (saved) {
        chromebooks = JSON.parse(saved);
    } else {
        // Primeira vez: popula com os dados patrimoniais e persiste
        chromebooks = CHROMEBOOKS_PADRAO.map(cb => ({ ...cb })); // cópia para não poluir o original
        salvar();
    }

    const emp = localStorage.getItem('emprestimos');
    if (emp) emprestimos = JSON.parse(emp);
}


// ── Salvar inventário no localStorage ────────────────────────
// Persiste apenas o array 'chromebooks'.
// O array 'emprestimos' não é salvo aqui; ele é de responsabilidade
// do scripts.js e só é lido nesta página para consultar status.
function salvar() {
    localStorage.setItem('chromebooks', JSON.stringify(chromebooks));
}


// ── Calcular o status real de um chromebook ───────────────────
// Esta é a função central do inventário:
// 1. Consulta o array de empréstimos em busca de um registro
//    com a mesma plaqueta e status 'ativo'.
// 2. Se encontrar → retorna 'emprestado' (não pode ser alterado manualmente).
// 3. Se não encontrar → retorna o status manual salvo no inventário
//    ('disponivel' ou 'manutencao').
function getStatusReal(plaqueta) {
    const emprestado = emprestimos.find(
        e => e.plaqueta === plaqueta && e.status === 'ativo'
    );
    if (emprestado) return 'emprestado';

    // Busca o chromebook no inventário local para ler o status manual
    const cb = chromebooks.find(c => c.plaqueta === plaqueta);
    return cb ? cb.status : 'disponivel'; // fallback: disponivel
}


// ── Capturar envio do formulário de cadastro ──────────────────
// Adiciona um novo chromebook ao inventário ao clicar em
// "Adicionar ao Inventário". Valida se a plaqueta já existe.
document.getElementById('formChromebook').addEventListener('submit', (e) => {
    e.preventDefault(); // impede o recarregamento da página

    // Lê os três campos do formulário
    const plaqueta = document.getElementById('plaqueta').value.trim(); // .trim() remove espaços acidentais
    const condicao = document.getElementById('condicao').value;
    const status   = document.getElementById('statusInicial').value;

    // Impede duplicatas: cada plaqueta deve ser única no inventário
    if (chromebooks.some(c => c.plaqueta === plaqueta)) {
        alert('Essa plaqueta já está cadastrada!');
        return;
    }

    // Adiciona o novo objeto ao array em memória e persiste
    chromebooks.push({ plaqueta, condicao, status });
    salvar();
    renderizar();
    e.target.reset(); // limpa o formulário para o próximo cadastro
    alert(`Chromebook ${plaqueta} adicionado ao inventário!`);
});


// ── Renderizar a tabela de inventário ─────────────────────────
// Reconstrói toda a tabela sempre que algo muda.
// Também relê 'emprestimos' do localStorage a cada chamada,
// garantindo que o status esteja sempre atualizado.
function renderizar() {
    // Relê os empréstimos para capturar qualquer mudança feita em
    // outra aba/página desde a última renderização.
    const emp = localStorage.getItem('emprestimos');
    emprestimos = emp ? JSON.parse(emp) : [];

    const tbody = document.getElementById('chromebooksBody');

    // Estado vazio: exibe mensagem na tabela e zera os cards
    if (chromebooks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="sem-registros">Nenhum Chromebook cadastrado ainda.</td></tr>';
        atualizarStats([]);
        return;
    }

    // Ordena pelo número da plaqueta em ordem crescente.
    // localeCompare com { numeric: true } garante que "2" venha antes de "10"
    // (comparação numérica), ao invés de "10" vir antes de "2"
    // (comparação alfabética padrão).
    const sorted = [...chromebooks].sort(
        (a, b) => a.plaqueta.localeCompare(b.plaqueta, 'pt-BR', { numeric: true })
    );

    // Gera o HTML de cada linha da tabela
    tbody.innerHTML = sorted.map(cb => {
        const statusReal    = getStatusReal(cb.plaqueta); // status calculado dinamicamente
        const statusBadge   = getStatusBadge(statusReal); // HTML do badge colorido
        const condicaoBadge = getCondicaoBadge(cb.condicao); // HTML do badge de condição

        // Não permite excluir se estiver emprestado (segurança de dados)
        const podeExcluir = statusReal !== 'emprestado';

        // O botão de manutenção só aparece se o chromebook NÃO estiver emprestado.
        // Quando o status manual é 'manutencao', o texto muda para "Liberar" (toggle).
        const btnManutencao = statusReal !== 'emprestado'
            ? `<button class="btn-sm btn-manutencao" onclick="toggleManutencao('${cb.plaqueta}')">
                   ${cb.status === 'manutencao' ? 'Liberar' : 'Manutenção'}
               </button>`
            : ''; // string vazia = botão não aparece

        return `
            <tr>
                <!-- Número da plaqueta em negrito para fácil leitura -->
                <td><strong>${cb.plaqueta}</strong></td>

                <!-- Badge colorido: Bom (verde), Regular (laranja), Ruim (vermelho) -->
                <td>${condicaoBadge}</td>

                <!-- Badge de status calculado dinamicamente -->
                <td>${statusBadge}</td>

                <!-- Botões de ação: sempre mostra Editar; Manutenção e Excluir
                     só aparecem se o chromebook não estiver emprestado -->
                <td class="acoes-cell">
                    <button class="btn-sm btn-editar" onclick="editarCondicao('${cb.plaqueta}')">Editar</button>
                    ${btnManutencao}
                    ${podeExcluir
                        ? `<button class="btn-sm btn-excluir-sm" onclick="excluir('${cb.plaqueta}')">Excluir</button>`
                        : '' // sem botão excluir para chromebooks emprestados
                    }
                </td>
            </tr>
        `;
    }).join(''); // .join('') une todas as linhas em uma string HTML única

    atualizarStats(sorted); // atualiza os 4 cards de contagem
}


// ── Gerar HTML do badge de status ─────────────────────────────
// Usa um objeto como mapa de status → HTML, evitando if/else repetitivos.
// Se o status não estiver no mapa, cria um badge sem classe específica.
function getStatusBadge(status) {
    const map = {
        disponivel: '<span class="badge badge-disponivel">Disponível</span>',
        emprestado: '<span class="badge badge-emprestado">Emprestado</span>',
        manutencao: '<span class="badge badge-manutencao">Em Manutenção</span>',
    };
    return map[status] || `<span class="badge">${status}</span>`;
}


// ── Gerar HTML do badge de condição ──────────────────────────
// Mesmo padrão de mapa do getStatusBadge, aplicado às condições físicas.
function getCondicaoBadge(condicao) {
    const map = {
        Bom:     '<span class="badge badge-bom">Bom</span>',
        Regular: '<span class="badge badge-regular">Regular</span>',
        Ruim:    '<span class="badge badge-ruim">Ruim</span>',
    };
    return map[condicao] || `<span class="badge">${condicao}</span>`;
}


// ── Atualizar os cards de resumo ──────────────────────────────
// Conta quantos chromebooks estão em cada status e atualiza
// os números exibidos nos quatro cards no topo da página.
function atualizarStats(sorted) {
    let disponivel = 0, emprestado = 0, manutencao = 0;

    // Percorre todos os chromebooks e classifica cada um
    sorted.forEach(cb => {
        const s = getStatusReal(cb.plaqueta);
        if (s === 'disponivel')      disponivel++;
        else if (s === 'emprestado') emprestado++;
        else if (s === 'manutencao') manutencao++;
    });

    // Atualiza o conteúdo de texto de cada card no DOM
    document.getElementById('totalCount').textContent      = sorted.length;
    document.getElementById('disponivelCount').textContent = disponivel;
    document.getElementById('emprestadoCount').textContent = emprestado;
    document.getElementById('manutencaoCount').textContent = manutencao;
}


// ── Editar a condição física do chromebook ────────────────────
// Abre um prompt nativo do navegador para o usuário digitar a
// nova condição. Normaliza o texto (primeira letra maiúscula,
// restante minúscula) e valida antes de salvar.
function editarCondicao(plaqueta) {
    const cb = chromebooks.find(c => c.plaqueta === plaqueta);
    if (!cb) return; // segurança: interrompe se não encontrar

    const opcoes = ['Bom', 'Regular', 'Ruim'];

    // prompt() exibe uma caixa de diálogo com campo de texto.
    // Retorna null se o usuário cancelar.
    const nova = prompt(
        `Chromebook ${plaqueta}\nCondição atual: ${cb.condicao}\n\nNova condição (Bom / Regular / Ruim):`
    );
    if (!nova) return; // usuário cancelou ou deixou em branco

    // Normaliza: "bom", "BOM", "bOm" → "Bom"
    // charAt(0).toUpperCase() coloca a primeira letra em maiúsculo
    // slice(1).toLowerCase() coloca o restante em minúsculo
    const normalizada = nova.trim().charAt(0).toUpperCase() + nova.trim().slice(1).toLowerCase();

    if (!opcoes.includes(normalizada)) {
        alert('Condição inválida. Escolha: Bom, Regular ou Ruim.');
        return;
    }

    cb.condicao = normalizada; // atualiza o objeto diretamente (é uma referência)
    salvar();
    renderizar();
}


// ── Alternar entre Disponível e Em Manutenção ─────────────────
// Funciona como um toggle (interruptor):
//   - Se está 'manutencao' → muda para 'disponivel'
//   - Se está 'disponivel' → muda para 'manutencao'
// O botão na tabela exibe "Liberar" ou "Manutenção" de acordo.
function toggleManutencao(plaqueta) {
    const cb = chromebooks.find(c => c.plaqueta === plaqueta);
    if (!cb) return;
    cb.status = cb.status === 'manutencao' ? 'disponivel' : 'manutencao';
    salvar();
    renderizar();
}


// ── Excluir chromebook do inventário ─────────────────────────
// Antes de excluir, verifica se o chromebook está emprestado.
// Se estiver, bloqueia a exclusão para evitar inconsistência
// entre o inventário e os registros de empréstimo.
function excluir(plaqueta) {
    if (getStatusReal(plaqueta) === 'emprestado') {
        alert('Não é possível excluir um Chromebook que está emprestado.');
        return;
    }
    if (confirm(`Excluir o Chromebook ${plaqueta} do inventário?`)) {
        // filter() cria um novo array sem o item da plaqueta passada
        chromebooks = chromebooks.filter(c => c.plaqueta !== plaqueta);
        salvar();
        renderizar();
    }
}
