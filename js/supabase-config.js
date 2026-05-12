// =============================================================
// supabase-config.js — Configuração do cliente Supabase
// Compartilhado por scripts.js e chromebooks.js.
// O cliente 'db' é a instância global usada em todas as
// operações de leitura e escrita no banco de dados.
// =============================================================

const SUPABASE_URL  = 'https://oshjwiyjnnudtzxhoxwq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zaGp3aXlqbm51ZHR6eGhveHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NjMzODMsImV4cCI6MjA5NDEzOTM4M30._ZLCaoK9j7oYGBLiTtxTRKeR_qSc3AQ1aSR0sHNwt5E';

// createClient vem da biblioteca carregada via CDN no HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);
