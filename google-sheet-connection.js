(function (window) {
  const API_URL = 'https://script.google.com/macros/s/AKfycbziIDXCdvxDew-z_xqeX5kA39auPHt_r8pkE7rihGvQ3LMq1uvbd1mcaN69VqzeBhdUpA/exec';

  // Không lưu mật khẩu Google ở đây. Nếu Apps Script của bạn dùng APP_TOKEN,
  // điền đúng token vào biến GIAOAN_APP_TOKEN trong lúc triển khai riêng.
  const APP_TOKEN = window.GIAOAN_APP_TOKEN || 'giaoan-token-2026-private';

  function buildUrl(action) {
    const url = new URL(API_URL);
    url.searchParams.set('action', action);
    if (APP_TOKEN) url.searchParams.set('token', APP_TOKEN);
    return url.toString();
  }

  function normalizeResponse(payload) {
    if (!payload || payload.ok === false) {
      throw new Error(payload?.error || 'Apps Script không trả về dữ liệu hợp lệ.');
    }

    // Hỗ trợ cả định dạng JSON mới: { ok: true, data: {...} }
    // và định dạng cũ: { ok: true, children: [...], goals: [...] }.
    return payload.data || (
      Array.isArray(payload.children) || Array.isArray(payload.goals)
        ? { children: payload.children || [], goals: payload.goals || [] }
        : null
    );
  }

  async function load() {
    const response = await fetch(buildUrl('load'), {
      method: 'GET',
      redirect: 'follow',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Không thể tải dữ liệu (${response.status}).`);
    }

    return normalizeResponse(await response.json());
  }

  async function save(data) {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'save',
        token: APP_TOKEN,
        data,
        // Giữ tương thích với Apps Script bản cũ lưu children/goals riêng.
        children: data?.children || [],
        goals: data?.goals || []
      })
    });

    if (!response.ok) {
      throw new Error(`Không thể lưu dữ liệu (${response.status}).`);
    }

    return normalizeResponse(await response.json()) || { ok: true };
  }

  window.GiaoAnCloud = {
    apiUrl: API_URL,
    load,
    save
  };
})(window);
