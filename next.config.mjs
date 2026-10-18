// Adresse et clé PUBLIQUES de Supabase (elles peuvent être visibles, la base est protégée par ses règles).
const SUPABASE_URL = "https://cfjjwakzjykbifuvnygz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "COLLE_TA_CLE_ICI";

const clean = (v) => (v || "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL) || SUPABASE_URL;
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() || SUPABASE_PUBLISHABLE_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseKey;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey,
  },
};

export default nextConfig;
