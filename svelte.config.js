import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import adapterVercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// ADAPTER=vercel 时产出 Vercel 版本；默认产出 Cloudflare Pages 版本。
const useVercel = process.env.ADAPTER === 'vercel';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: useVercel ? adapterVercel({ runtime: 'nodejs22.x' }) : adapterCloudflare()
  }
};

export default config;
