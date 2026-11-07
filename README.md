# QingKong Songlist（Cloudflare 定制版）

单主播 VTuber 歌单与愿望单管理的站点。

本仓库基于 [QingKong Isaac 的 QingKong Songlist](https://github.com/zclkkk/songlist-qk) 修改，
用于一位 VTuber 的公开歌单。原项目以 **Parity Public License 7.0.0** 授权，
按照该协议 Copyleft 条款的要求，本仓库的修改同样以该协议开放共享，
并保留原作者署名与源码地址（见 [LICENSE](./LICENSE)）。

---

## 与原版的差异

### 1. 部署目标改为 Cloudflare Pages

- 适配器换成 `@sveltejs/adapter-cloudflare@7.2.9`（对应 SvelteKit 2.x）
- 新增 `wrangler.toml`，开启 `compatibility_flags = ["nodejs_compat"]`
  （代码里用到 `node:crypto` 的 `createHmac` / `createHash` / `randomUUID` 和 `Buffer`）
- `svelte.config.js` 支持用 `ADAPTER=vercel` 切回 Vercel 构建

### 2. 移除网易云音乐导入

原版用 `@neteasecloudmusicapienhanced/api` 解析网易云单曲/歌单，该包依赖
`express`、`jsdom`、`music-metadata` 等 Node 模块，**在 Cloudflare Workers 运行时无法加载**。

改动：

- 后台「网易云导入」页签改为 **「批量粘贴」**，新增 `src/lib/server/paste-import.ts`
  - 一行一首，列之间支持制表符、` - `、`–`、`—`、`－`、`|`
  - 只填了歌名的，原唱记为「未知」
- 公开页移除「一键从网易云填充」，改为手动填写歌名与原唱
- 原实现保留为 `netease.ts.disabled`，恢复到 Node 环境部署时可自行接回

### 3. 后台登录改为数据库函数校验

原版调用 `supabase.auth.signInWithPassword()`。但通过 SQL 手工创建的管理员账号，
GoTrue 的登录接口不认（密码哈希本身有效，`crypt()` 校验通过，登录仍报「邮箱或密码错误」）。

改动：

- 新增数据库函数 `public.verify_admin_password(p_email, p_password)`，
  用 pgcrypto 的 `crypt()` 直接比对 `auth.users.encrypted_password`
- `loginAdmin()` 改用 `supabase_admin.rpc('verify_admin_password', ...)`
- 函数只授权给 `service_role`，`anon` / `authenticated` 无权调用

> ⚠️ 这个实现没有失败次数限制。公开部署前建议自行加登录限流。

### 4. 语言推断只看歌名

原 `inferSongLanguage(title, artist)` 用「歌名 + 歌手」统计中日韩字符与拉丁字符。
`hita`、`CRITTY` 这类拉丁字母艺名会让「夙」「倾城」等中文歌被误判成英语。
现改为**优先按歌名判断**，歌手名仅作兜底。

### 5. 站名可配置

原本 `<title>`、页脚、顶栏都写死 `QingKong Songlist`。
现在统一读取数据库 `settings.hero_title`，改站名不用重新部署。

---

## 技术栈

SvelteKit 2 · Svelte 5 · Vite 8 · Tailwind CSS 4 · Supabase · Zod 4

## 本地开发

```bash
npm install
cp .env.example .env
# 填好四个变量，然后在 Supabase SQL Editor 执行 supabase/schema.sql
npm run dev
```

需要 Node 20.19+ 或 22.12+。

### 环境变量

| 变量 | 说明 |
|---|---|
| `PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key（`sb_publishable_...`），浏览器端可用 |
| `SUPABASE_SECRET_KEY` | Secret key（`sb_secret_...`），**仅服务端** |
| `AUTH_SECRET` | 后台 session cookie 的 HMAC 密钥，32 字节随机 |

生成 `AUTH_SECRET`：

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### 初始化数据库

在 Supabase 的 SQL Editor 里执行 `supabase/schema.sql`。它会创建：

- `songs` / `requests` / `settings` / `request_rate_limits` 四张表
- 愿望单受理、限流、重置等 RPC 函数
- `site-assets` 公开存储桶
- `verify_admin_password` 登录校验函数
- 前台只读的 RLS 策略

### 创建管理员

本项目不使用 Supabase Auth 的注册流程，直接写入 `auth.users`：

```sql
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated',
  'admin@example.com', crypt('换成你的密码', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, false
);
```

注意 `auth.users.confirmed_at` 和 `auth.identities.email` 都是生成列，不要手动写入。

## 部署到 Cloudflare Pages

```bash
npm run build
npx wrangler pages project create <项目名> --production-branch main
npx wrangler pages deploy .svelte-kit/cloudflare --project-name <项目名>
```

构建时 `.env` 里的值会被内联进 Worker 产物（服务端 bundle，不会下发到浏览器）。

## 已知限制

- **Supabase 免费项目连续 7 天无请求会自动暂停**，需要去控制台手动恢复
- 首页一次性 SSR 渲染全部曲目（约 1000 首时 HTML 接近 1 MB），曲目多时建议改成分页或虚拟滚动
- 没有自动化测试
- 登录接口没有失败限流

## 许可

**Parity Public License 7.0.0**，见 [LICENSE](./LICENSE)。

- 可以免费使用和分享本软件
- 若用它开发、运行或分析其他软件，相关软件也需按协议要求开放共享
- 分发时需保留许可证全文、作者署名和源码地址
