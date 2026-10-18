// Nettoie l'adresse Supabase si elle a été collée avec "/rest/v1/" ou un "/" à la fin.
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim(),
  },
};

export default nextConfig;
