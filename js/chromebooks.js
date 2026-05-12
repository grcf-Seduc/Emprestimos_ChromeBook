// =============================================================
// chromebooks.js — Inventário, conectado ao Supabase
// O cliente 'db' vem de supabase-config.js.
// =============================================================

// Dados patrimoniais padrão: carregados automaticamente na primeira
// vez que a página abre (quando a tabela chromebooks está vazia).
// EST. CONS. 02 da planilha = condição "Bom".
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

let chromebooks = [];
let emprestimos = [];

// ── Inicialização ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await carregar();
    renderizar();
});

// ── Carregar dados do Supabase ────────────────────────────────
// Lê o inventário e os empréstimos ativos.
// Se o inventário estiver vazio (primeira vez), insere os 16 padrões.
async function carregar() {
    // 1. Carrega inventário
    const { data: cbData, error: cbError } = await db
        .from('chromebooks')
        .select('*');

    if (cbError) {
        console.error('Erro ao carregar inventário:', cbError.message);
        alert('Não foi possível carregar o inventário.');
        return;
    }

    if (!cbData || cbData.length === 0) {
        // Primeira visita: insere os 16 chromebooks patrimoniais
        const { data: inseridos, error: insertError } = await db
            .from('chromebooks')
            .insert(CHROMEBOOKS_PADRAO)
            .select();

        if (insertError) {
            console.error('Erro ao inserir dados padrão:', insertError.message);
        } else {
            chromebooks = inseridos || [];
        }
    } else {
        chromebooks = cbData;
    }

    // 2. Carrega empréstimos ativos para derivar o status de cada chromebook
    // Busca apenas os campos necessários (plaqueta e status) para economizar banda
    const { data: empData, error: empError } = await db
        .from('emprestimos')
        .select('plaqueta, status');

    if (empError) {
        console.error('Erro ao carregar empréstimos:', empError.message);
    } else {
        emprestimos = empData || [];
    }
}

// ── Status real: verifica se o chromebook está emprestado ─────
// Consulta o array de empréstimos em memória para derivar o status.
// Se houver um empréstimo ativo com essa plaqueta, retorna 'emprestado'.
// Caso contrário, retorna o status manual do inventário.
function getStatusReal(plaqueta) {
    const emprestado = emprestimos.find(
        e => e.plaqueta === plaqueta && e.status === 'ativo'
    );
    if (emprestado) return 'emprestado';
    const cb = chromebooks.find(c => c.plaqueta === plaqueta);
    return cb ? cb.status : 'disponivel';
}

// ── Cadastrar novo chromebook ─────────────────────────────────
document.getElementById('formChromebook').addEventListener('submit', async (e) => {
    e.preventDefault();

    const plaqueta = document.getElementById('plaqueta').value.trim();
    const condicao = document.getElementById('condicao').value;
    const status   = document.getElementById('statusInicial').value;

    if (chromebooks.some(c => c.plaqueta === plaqueta)) {
        alert('Essa plaqueta já está cadastrada!');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Adicionando...';

    const { data, error } = await db
        .from('chromebooks')
        .insert({ plaqueta, condicao, status })
        .select()
        .single();

    btn.disabled = false;
    btn.textContent = 'Adicionar ao Inventário';

    if (error) {
        console.error('Erro ao cadastrar:', error.message);
        alert('Erro ao adicionar chromebook. Tente novamente.');
        return;
    }

    chromebooks.push(data);
    renderizar();
    e.target.reset();
    alert(`Chromebook ${plaqueta} adicionado ao inventário!`);
});

// ── Renderizar tabela ─────────────────────────────────────────
function renderizar() {
    const tbody = document.getElementById('chromebooksBody');

    if (chromebooks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="sem-registros">Nenhum Chromebook cadastrado ainda.</td></tr>';
        atualizarStats([]);
        return;
    }

    const sorted = [...chromebooks].sort(
        (a, b) => a.plaqueta.localeCompare(b.plaqueta, 'pt-BR', { numeric: true })
    );

    tbody.innerHTML = sorted.map(cb => {
        const statusReal    = getStatusReal(cb.plaqueta);
        const statusBadge   = getStatusBadge(statusReal);
        const condicaoBadge = getCondicaoBadge(cb.condicao);
        const podeExcluir   = statusReal !== 'emprestado';

        const btnManutencao = statusReal !== 'emprestado'
            ? `<button class="btn-sm btn-manutencao" onclick="toggleManutencao('${cb.plaqueta}')">
                   ${cb.status === 'manutencao' ? 'Liberar' : 'Manutenção'}
               </button>`
            : '';

        return `
            <tr>
                <td><strong>${cb.plaqueta}</strong></td>
                <td>${condicaoBadge}</td>
                <td>${statusBadge}</td>
                <td class="acoes-cell">
                    <button class="btn-sm btn-editar" onclick="editarCondicao('${cb.plaqueta}')">Editar</button>
                    ${btnManutencao}
                    ${podeExcluir
                        ? `<button class="btn-sm btn-excluir-sm" onclick="excluir('${cb.plaqueta}')">Excluir</button>`
                        : ''}
                </td>
            </tr>
        `;
    }).join('');

    atualizarStats(sorted);
}

function getStatusBadge(status) {
    const map = {
        disponivel: '<span class="badge badge-disponivel">Disponível</span>',
        emprestado: '<span class="badge badge-emprestado">Emprestado</span>',
        manutencao: '<span class="badge badge-manutencao">Em Manutenção</span>',
    };
    return map[status] || `<span class="badge">${status}</span>`;
}

function getCondicaoBadge(condicao) {
    const map = {
        Bom:     '<span class="badge badge-bom">Bom</span>',
        Regular: '<span class="badge badge-regular">Regular</span>',
        Ruim:    '<span class="badge badge-ruim">Ruim</span>',
    };
    return map[condicao] || `<span class="badge">${condicao}</span>`;
}

function atualizarStats(sorted) {
    let disponivel = 0, emprestado = 0, manutencao = 0;
    sorted.forEach(cb => {
        const s = getStatusReal(cb.plaqueta);
        if (s === 'disponivel')      disponivel++;
        else if (s === 'emprestado') emprestado++;
        else if (s === 'manutencao') manutencao++;
    });
    document.getElementById('totalCount').textContent      = sorted.length;
    document.getElementById('disponivelCount').textContent = disponivel;
    document.getElementById('emprestadoCount').textContent = emprestado;
    document.getElementById('manutencaoCount').textContent = manutencao;
}

// ── Editar condição ───────────────────────────────────────────
async function editarCondicao(plaqueta) {
    const cb = chromebooks.find(c => c.plaqueta === plaqueta);
    if (!cb) return;

    const opcoes  = ['Bom', 'Regular', 'Ruim'];
    const nova    = prompt(`Chromebook ${plaqueta}\nCondição atual: ${cb.condicao}\n\nNova condição (Bom / Regular / Ruim):`);
    if (!nova) return;

    const normalizada = nova.trim().charAt(0).toUpperCase() + nova.trim().slice(1).toLowerCase();
    if (!opcoes.includes(normalizada)) {
        alert('Condição inválida. Escolha: Bom, Regular ou Ruim.');
        return;
    }

    const { error } = await db
        .from('chromebooks')
        .update({ condicao: normalizada })
        .eq('plaqueta', plaqueta);

    if (error) {
        console.error('Erro ao editar condição:', error.message);
        alert('Erro ao salvar. Tente novamente.');
        return;
    }

    cb.condicao = normalizada;
    renderizar();
}

// ── Alternar manutenção / disponível ──────────────────────────
async function toggleManutencao(plaqueta) {
    const cb = chromebooks.find(c => c.plaqueta === plaqueta);
    if (!cb) return;

    const novoStatus = cb.status === 'manutencao' ? 'disponivel' : 'manutencao';

    const { error } = await db
        .from('chromebooks')
        .update({ status: novoStatus })
        .eq('plaqueta', plaqueta);

    if (error) {
        console.error('Erro ao alterar status:', error.message);
        alert('Erro ao salvar. Tente novamente.');
        return;
    }

    cb.status = novoStatus;
    renderizar();
}

// ── Excluir chromebook ────────────────────────────────────────
async function excluir(plaqueta) {
    if (getStatusReal(plaqueta) === 'emprestado') {
        alert('Não é possível excluir um Chromebook que está emprestado.');
        return;
    }
    if (!confirm(`Excluir o Chromebook ${plaqueta} do inventário?`)) return;

    const { error } = await db
        .from('chromebooks')
        .delete()
        .eq('plaqueta', plaqueta);

    if (error) {
        console.error('Erro ao excluir:', error.message);
        alert('Erro ao excluir. Tente novamente.');
        return;
    }

    chromebooks = chromebooks.filter(c => c.plaqueta !== plaqueta);
    renderizar();
}
