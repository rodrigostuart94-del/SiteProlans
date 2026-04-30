/* ============================================================
   PROLANS — Supabase Client wrapper
   Inicializa o cliente e expõe APIs simples em window.prolansDB
   ============================================================ */
(function () {
  "use strict";

  const SUPABASE_URL = "https://onsdzldigpqsbvlbgvqb.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_aBfO7ai8ZjWYHwLND493FA_jybrbxep";

  if (!window.supabase) {
    console.error("Supabase SDK não carregado. Verifique o <script> do CDN.");
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });

  // ===== AUTH
  async function signUp(email, password, nome) {
    return sb.auth.signUp({
      email, password,
      options: { data: { nome } }
    });
  }
  async function signIn(email, password) {
    return sb.auth.signInWithPassword({ email, password });
  }
  async function signOut() { return sb.auth.signOut(); }
  async function getSession() {
    const { data } = await sb.auth.getSession();
    return data.session;
  }
  async function getUser() {
    const { data } = await sb.auth.getUser();
    return data.user;
  }
  async function getProfile(userId) {
    const id = userId || (await getUser())?.id;
    if (!id) return null;
    const { data, error } = await sb.from("profiles").select("*").eq("id", id).single();
    if (error) return null;
    return data;
  }
  async function updateProfile(patch) {
    const u = await getUser();
    if (!u) return { error: { message: "Não autenticado" } };
    return sb.from("profiles").update(patch).eq("id", u.id);
  }

  // ===== ADMIN: lista todos os clientes (RLS permite via is_admin)
  async function listAllProfiles() {
    return sb.from("profiles").select("*").order("created_at", { ascending: false });
  }

  // ===== Genérico CRUD por tabela
  function table(name) {
    return {
      // cliente: lista os SEUS dados; admin: lista todos (filtrado opcionalmente por user_id)
      async list(filterUserId) {
        let q = sb.from(name).select("*").order("created_at", { ascending: false });
        if (filterUserId) q = q.eq("user_id", filterUserId);
        return q;
      },
      async byId(id) { return sb.from(name).select("*").eq("id", id).single(); },
      async insert(row) { return sb.from(name).insert(row).select().single(); },
      async update(id, patch) { return sb.from(name).update(patch).eq("id", id).select().single(); },
      async remove(id) { return sb.from(name).delete().eq("id", id); }
    };
  }

  // ===== LEADS
  const leads = {
    async create(payload) { return sb.from("leads").insert(payload).select().single(); },
    async list() { return sb.from("leads").select("*").order("created_at", { ascending: false }); },
    async update(id, patch) { return sb.from("leads").update(patch).eq("id", id).select().single(); },
    async remove(id) { return sb.from("leads").delete().eq("id", id); }
  };

  // ===== Cliente — atalhos para suas próprias coleções
  async function myData(coll) {
    const u = await getUser();
    if (!u) return { data: [], error: { message: "Não autenticado" } };
    return sb.from(coll).select("*").eq("user_id", u.id).order("created_at", { ascending: false });
  }

  // ===== Onboarding admin: cria/promove o usuário admin
  async function ensureAdmin(email, password) {
    // Tenta logar; se não der, registra e logo já marca como admin via update direto
    const login = await signIn(email, password);
    if (!login.error) return { ok: true, info: "logged" };
    const reg = await signUp(email, password, "Administrador Prolans");
    if (reg.error) return { ok: false, error: reg.error };
    // Em produção o admin precisa ser promovido via SQL — aqui retornamos instrução
    return { ok: true, info: "registered_needs_promotion" };
  }

  // Expor
  window.prolansDB = {
    sb, signUp, signIn, signOut, getSession, getUser, getProfile, updateProfile,
    listAllProfiles, table, leads, myData, ensureAdmin,
    URL: SUPABASE_URL
  };
})();
