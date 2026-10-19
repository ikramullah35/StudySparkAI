/** @type {import('next').NextConfig} */
const nextConfig = {
  // `pdf-parse` ships a PDF.js worker that must stay outside the bundler.
  // Keeping it external avoids "worker not found" errors in dev and on Vercel.
  serverExternalPackages: ["pdf-parse"],

  // Tailwind CSS v4 is compiled by Turbopack (the default bundler in Next.js 16).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
