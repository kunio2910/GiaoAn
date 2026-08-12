const API_URL = 'https://script.google.com/macros/s/AKfycbziIDXCdvxDew-z_xqeX5kA39auPHt_r8pkE7rihGvQ3LMq1uvbd1mcaN69VqzeBhdUpA/exec';
const APP_TOKEN = typeof process !== 'undefined'
  ? process.env.NEXT_PUBLIC_GIAOAN_APP_TOKEN ?? 'giaoan-token-2026-private'
  : 'giaoan-token-2026-private';

export type CloudData = Record<string, unknown> & {
  children?: unknown[];
  goals?: unknown[];
};

type CloudResponse<T> = {
  ok?: boolean;
  error?: string;
  data?: T;
  children?: unknown[];
  goals?: unknown[];
};

function buildUrl(action: string) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  if (APP_TOKEN) url.searchParams.set('token', APP_TOKEN);
  return url.toString();
}

export async function loadCloudData<T extends CloudData = CloudData>(): Promise<T | null> {
  const response = await fetch(buildUrl('load'), {
    method: 'GET',
    redirect: 'follow',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Không thể tải dữ liệu (${response.status}).`);
  }

  const payload = await response.json() as CloudResponse<T>;

  if (payload.ok === false) {
    throw new Error(payload.error || 'Apps Script không trả về dữ liệu hợp lệ.');
  }

  if (payload.data) return payload.data;

  if (Array.isArray(payload.children) || Array.isArray(payload.goals)) {
    return {
      children: payload.children || [],
      goals: payload.goals || [],
    } as T;
  }

  return null;
}

export async function saveCloudData(data: CloudData) {
  const response = await fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'save',
      token: APP_TOKEN,
      data,
      // Tương thích với Apps Script bản cũ lưu children/goals riêng.
      children: data.children || [],
      goals: data.goals || [],
    }),
  });

  if (!response.ok) {
    throw new Error(`Không thể lưu dữ liệu (${response.status}).`);
  }

  const payload = await response.json() as CloudResponse<CloudData>;

  if (payload.ok === false) {
    throw new Error(payload.error || 'Apps Script từ chối lưu dữ liệu.');
  }

  return payload;
}

export { API_URL as GOOGLE_SHEET_API_URL };
