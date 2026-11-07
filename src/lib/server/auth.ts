import { createHmac, timingSafeEqual } from 'node:crypto';

import { dev } from '$app/environment';
import { authSecret } from '$lib/server/env';
import { supabaseAdmin } from '$lib/server/supabase';
import type { Cookies } from '@sveltejs/kit';

const sessionCookieName = 'songlist_admin_session';
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

const signValue = (value: string) => createHmac('sha256', authSecret).update(value).digest('hex');

const buildCookieValue = () => {
  const payload = `admin:${Date.now()}`;
  const signature = signValue(payload);
  return `${payload}.${signature}`;
};

export const setAdminSession = (cookies: Cookies) => {
  cookies.set(sessionCookieName, buildCookieValue(), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: !dev,
    maxAge: sessionMaxAgeSeconds
  });
};

export const clearAdminSession = (cookies: Cookies) => {
  cookies.delete(sessionCookieName, {
    path: '/'
  });
};

export const verifyAdminSession = (cookies: Cookies) => {
  const raw = cookies.get(sessionCookieName);

  if (!raw) {
    return false;
  }

  const [payload, signature] = raw.split('.');

  if (!payload || !signature) {
    return false;
  }

  const provided = Buffer.from(signature, 'hex');
  const expected = Buffer.from(signValue(payload), 'hex');

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return false;
  }

  const issuedAt = Number(payload.split(':')[1]);

  return Date.now() - issuedAt <= sessionMaxAgeSeconds * 1000;
};

export const loginAdmin = async ({
  email,
  password
}: {
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; message: string }> => {
  const normalizedEmail = email.trim().toLowerCase();

  // 直接查数据库校验密码，不依赖 Supabase Auth 的登录接口：
  // 手工创建的管理员账号 GoTrue 不认，而且 signInWithPassword 需要公网可达 auth 服务。
  const { data, error } = await supabaseAdmin.rpc('verify_admin_password', {
    p_email: normalizedEmail,
    p_password: password
  });

  if (error || data !== true) {
    return {
      ok: false,
      message: '邮箱或密码错误。'
    };
  }

  return { ok: true };
};
