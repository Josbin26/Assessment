
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

async function req(path, opts = {}) {
  let response;

  try {
    response = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {})
      }
    });
  } catch {
    throw new Error(
      'Cannot reach API. Check the backend connection.'
    );
  }

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.success) {
    throw new Error(
      body?.message || `Request failed (${response.status})`
    );
  }

  return body.data;
}

export const getApplications = (filters) => {
  const params = new URLSearchParams();

  if (filters?.status && filters.status !== 'All') {
    params.set('status', filters.status);
  }

  if (filters?.search) {
    params.set('search', filters.search);
  }

  const query = params.toString();

  return req('/applications' + (query ? `?${query}` : ''));
};

export const getStats = () =>
  req('/applications/stats');

export const getApplication = (id) =>
  req('/applications/' + id);

export const createApplication = (data) =>
  req('/applications', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const updateApplication = (id, data) =>
  req('/applications/' + id, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const changeStatus = (id, status) =>
  req('/applications/' + id + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });

export const deleteApplication = (id) =>
  req('/applications/' + id, {
    method: 'DELETE'
  });
