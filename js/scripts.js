// =============================================================
// scripts.js — Página de Empréstimos, conectado ao Supabase
// O cliente 'db' vem de supabase-config.js (carregado antes no HTML).
// Todas as operações de dados são assíncronas (async/await).
// =============================================================

// Array em memória com os empréstimos carregados do banco.
// Evita requisições repetidas ao Supabase a cada renderização.
let emprestimos = [];

// ── Inicialização ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await carregarEmprestimos();
    renderizarEmprestimos();
    // Preenche a data de empréstimo com a data de hoje automaticamente
    document.getElementById('data_emprestimo').value = new Date().toISOString().split('T')[0];

    // Se a página foi aberta pelo botão "Emprestar" do inventário,
    // a plaqueta vem na URL: index.html?plaqueta=557380
    // Pré-preenche o campo e rola a tela até o formulário.
    const plaquetaParam = new URLSearchParams(window.location.search).get('plaqueta');
    if (plaquetaParam) {
        document.getElementById('plaqueta').value = plaquetaParam;
        document.getElementById('recebe').scrollIntoView({ behavior: 'smooth' });
    }
});

// ── Carregar empréstimos do Supabase ──────────────────────────
// Busca todos os registros da tabela 'emprestimos' ordenados
// pelo mais recente. Atualiza o array em memória.
async function carregarEmprestimos() {
    const { data, error } = await db
        .from('emprestimos')
        .select('*')
        .order('data_emprestimo', { ascending: false });

    if (error) {
        console.error('Erro ao carregar:', error.message);
        alert('Não foi possível carregar os empréstimos. Verifique a conexão.');
        return;
    }
    emprestimos = data || [];
}

// ── Registrar novo empréstimo ─────────────────────────────────
document.getElementById('formEmprestimo').addEventListener('submit', async (e) => {
    e.preventDefault();

    const novoEmprestimo = {
        nome:             document.getElementById('nome').value,
        setor:            document.getElementById('setor').value,
        matricula:        document.getElementById('matricula').value,
        telefone:         document.getElementById('telefone').value,
        plaqueta:         document.getElementById('plaqueta').value,
        data_emprestimo:  document.getElementById('data_emprestimo').value,
        data_devolucao:   document.getElementById('data_devolucao').value,
        cedente:          document.getElementById('cedente').value,
        status:           'ativo',
        assinado_manualmente: false,
    };

    // Impede emprestar um chromebook que já está emprestado
    if (emprestimos.some(emp => emp.plaqueta === novoEmprestimo.plaqueta)) {
        alert('Esse chromebook já está emprestado!');
        return;
    }

    // Feedback visual: desabilita o botão enquanto salva
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Registrando...';

    // Insere no Supabase e recebe o registro completo (com id gerado pelo banco)
    const { data, error } = await db
        .from('emprestimos')
        .insert(novoEmprestimo)
        .select()
        .single();

    btn.disabled = false;
    btn.textContent = 'Emprestar';

    if (error) {
        console.error('Erro ao inserir:', error.message);
        alert('Erro ao registrar empréstimo. Tente novamente.');
        return;
    }

    emprestimos.push(data);
    renderizarEmprestimos();
    e.target.reset();
    document.getElementById('data_emprestimo').value = new Date().toISOString().split('T')[0];
    alert('Empréstimo registrado com sucesso!');
});

// ── Renderizar lista de empréstimos ───────────────────────────
function renderizarEmprestimos() {
    const container = document.getElementById('listaEmprestimos');
    container.innerHTML = '';

    if (emprestimos.length === 0) {
        container.innerHTML = '<p class="sem-registros">Nenhum empréstimo registrado ainda.</p>';
        return;
    }

    // Ordena do mais recente para o mais antigo
    const sorted = [...emprestimos].sort(
        (a, b) => new Date(b.data_emprestimo) - new Date(a.data_emprestimo)
    );

    container.innerHTML = sorted.map(emp => {
        const status = verificarStatus(emp);
        const statusClass = status === 'ativo' ? 'status-ativo' : 'status-atrasado';

        return `
            <div class="emprestimo-card" data-id="${emp.id}">
                <div class="emprestimo-header">
                    <div class="emprestimo-titulo">${emp.nome}</div>
                    <div class="plaqueta-badge">${emp.plaqueta}</div>
                </div>
                <div class="emprestimo-info">
                    <div class="info-item">
                        <span class="info-label">Setor</span>
                        <span class="info-value">${emp.setor}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Matrícula</span>
                        <span class="info-value">${emp.matricula}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Telefone</span>
                        <span class="info-value">${emp.telefone}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Data de Empréstimo</span>
                        <span class="info-value">${formatarData(emp.data_emprestimo)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Data de Devolução</span>
                        <span class="info-value">${formatarData(emp.data_devolucao)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Cedente</span>
                        <span class="info-value">${emp.cedente}</span>
                    </div>
                </div>
                <div class="emprestimo-footer">
                    <div class="status-container">
                        <span class="status-badge ${statusClass}">${status.toUpperCase()}</span>
                        ${emp.assinado_manualmente ? '<span class="status-badge status-assinado">📄 ASSINADO</span>' : ''}
                    </div>
                    <div class="emprestimo-acoes">
                        <button class="btn-assinar" onclick="gerarTermoEmprestimo(${emp.id})"> ✍️ Termo</button>
                        <button class="btn-devolver" onclick="devolverChromebook(${emp.id})"> ✓ Devolver</button>
                        <button class="btn-excluir" onclick="excluirEmprestimo(${emp.id})"> 🗑 Excluir</button>
                    </div>
                </div>
                <div class="signature-tracking">
                    <label class="checkbox-container">
                        <input type="checkbox" ${emp.assinado_manualmente ? 'checked' : ''} onchange="toggleAssinatura(${emp.id})">
                        Assinado fisicamente
                    </label>
                </div>
            </div>
        `;
    }).join('');
}

// ── Verificar status (ativo ou atrasado) ──────────────────────
function verificarStatus(emprestimo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataDevolucao = new Date(emprestimo.data_devolucao);
    dataDevolucao.setHours(0, 0, 0, 0);
    if (dataDevolucao < hoje && emprestimo.status === 'ativo') return 'atrasado';
    return emprestimo.status;
}

// ── Formatar data para exibição ───────────────────────────────
function formatarData(dataString) {
    if (!dataString) return '-';
    return new Date(dataString).toLocaleDateString('pt-BR');
}

// ── Devolver chromebook (apaga o registro) ────────────────────
async function devolverChromebook(id) {
    if (!confirm('Confirmar devolução do Chromebook?')) return;

    const { error } = await db.from('emprestimos').delete().eq('id', id);

    if (error) {
        console.error('Erro ao devolver:', error.message);
        alert('Erro ao registrar devolução. Tente novamente.');
        return;
    }

    emprestimos = emprestimos.filter(e => e.id !== id);
    renderizarEmprestimos();
}

// ── Excluir registro administrativamente ─────────────────────
async function excluirEmprestimo(id) {
    if (!confirm('Tem certeza que deseja excluir este empréstimo?')) return;

    const { error } = await db.from('emprestimos').delete().eq('id', id);

    if (error) {
        console.error('Erro ao excluir:', error.message);
        alert('Erro ao excluir empréstimo. Tente novamente.');
        return;
    }

    emprestimos = emprestimos.filter(e => e.id !== id);
    renderizarEmprestimos();
}

// ── Alternar assinatura física ────────────────────────────────
async function toggleAssinatura(id) {
    const emp = emprestimos.find(e => e.id === id);
    if (!emp) return;

    const novoValor = !emp.assinado_manualmente;

    const { error } = await db
        .from('emprestimos')
        .update({ assinado_manualmente: novoValor })
        .eq('id', id);

    if (error) {
        console.error('Erro ao atualizar assinatura:', error.message);
        return;
    }

    emp.assinado_manualmente = novoValor;
    renderizarEmprestimos();
}

// ── Gerar termo de responsabilidade para impressão ────────────
// Esta função é síncrona — apenas usa dados já carregados em memória.
function gerarTermoEmprestimo(id) {
    const emp = emprestimos.find(e => e.id === id);
    if (!emp) return;

    const printWindow = window.open('', '_blank');
    const dataEmprestimo = formatarData(emp.data_emprestimo);
    const dataDevolucao  = formatarData(emp.data_devolucao);

    printWindow.document.write(`
        <html>
        <head>
            <title>Termo de Empréstimo - ${emp.nome}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; line-height: 1.6; color: #000; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                .header img { max-width: 400px; max-height: 150px; margin-bottom: 20px; object-fit: contain; }
                .title { font-size: 26px; font-weight: bold; margin: 10px 0; text-transform: uppercase; }
                .content { margin-bottom: 50px; font-size: 16px; text-align: justify; }
                .info-grid { display: block; margin: 40px 0; border: 2px solid #000; overflow: hidden; }
                .info-row { display: flex; border-bottom: 1px solid #000; }
                .info-row:last-child { border-bottom: none; }
                .info-cell { flex: 1; padding: 15px 20px; border-right: 1px solid #000; }
                .info-cell:last-child { border-right: none; }
                .label { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #000; margin-bottom: 6px; display: block; }
                .value { font-size: 15px; font-weight: 500; }
                .signatures { margin-top: 120px; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; text-align: center; }
                .sig-line { border-top: 1.5px solid #000; margin-top: 60px; padding-top: 12px; font-size: 14px; font-weight: bold; }
                @media print { body { padding: 20px; } .info-grid { border: 1px solid #000; } }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="img/SEDUC.png" alt="SEDUC LOGO">
                <div class="title">TERMO DE RESPONSABILIDADE</div>
                <p>Empréstimo de Equipamento Tecnológico (Chromebook)</p>
            </div>
            <div class="content">
                <p>Eu, <strong>${emp.nome}</strong>, setor <strong>${emp.setor}</strong>, matrícula <strong>${emp.matricula}</strong>,
                declaro para os devidos fins que recebi nesta data o equipamento abaixo descrito em perfeitas condições de uso.</p>
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-cell"><span class="label">Equipamento</span><div class="value">Chromebook</div></div>
                        <div class="info-cell"><span class="label">Nº Plaqueta</span><div class="value">${emp.plaqueta}</div></div>
                    </div>
                    <div class="info-row">
                        <div class="info-cell"><span class="label">Data de Empréstimo</span><div class="value">${dataEmprestimo}</div></div>
                        <div class="info-cell"><span class="label">Data Prevista de Devolução</span><div class="value">${dataDevolucao}</div></div>
                    </div>
                    <div class="info-row">
                        <div class="info-cell"><span class="label">Telefone de Contato</span><div class="value">${emp.telefone}</div></div>
                        <div class="info-cell"><span class="label">Cedente Responsável</span><div class="value">${emp.cedente}</div></div>
                    </div>
                </div>
                <p style="margin-top: 20px;">Comprometo-me a zelar pela integridade do equipamento e a devolvê-lo na data estipulada.
                Em caso de danos por mau uso ou extravio, assumo total responsabilidade pelo reparo ou reposição imediata do mesmo conforme normas vigentes.</p>
            </div>
            <div class="signatures">
                <div><div class="sig-line">Assinatura do Receptor</div></div>
                <div><div class="sig-line">Assinatura do Cedente</div></div>
            </div>
            <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #888;">
                Gerado automaticamente pelo Sistema de Gestão de Chromebooks - ${new Date().toLocaleDateString('pt-BR')}
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() { window.print(); setTimeout(function() { window.close(); }, 500); }, 500);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
