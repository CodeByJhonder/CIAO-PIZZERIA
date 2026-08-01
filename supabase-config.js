// ============================================================
// Configuración de conexión a Supabase — CIAO Pizzería
// Este archivo se usa tanto en el sitio público (para guardar
// pedidos) como en el panel de administración (para leerlos).
// ============================================================

const SUPABASE_URL = "https://iwmfmfdfchwmrlfquqg.supabase.co";
const SUPABASE_KEY = "sb_publishable_maWvUTY598tFmmWoHpU23g_LpYV8Dvl";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
