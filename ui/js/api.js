// API client for project management server

const API = {
  base: '/api',

  async request(path, options = {}) {
    const url = `${this.base}${path}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  },

  // Current user
  getMe() {
    return this.request('/me');
  },

  // Config
  getConfig() {
    return this.request('/config');
  },

  // Issues
  listIssues() {
    return this.request('/issues');
  },

  getIssue(id) {
    return this.request(`/issues/${id}`);
  },

  createIssue(data) {
    return this.request('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateIssue(id, data) {
    return this.request(`/issues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateDescription(id, content) {
    return this.request(`/issues/${id}/description`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  addComment(id, data) {
    return this.request(`/issues/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateComment(issueId, commentId, data) {
    return this.request(`/issues/${issueId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getTodos() {
    return this.request('/todos');
  },

  deleteIssue(id) {
    return this.request(`/issues/${id}`, { method: 'DELETE' });
  },

  // Wiki
  getWikiIndex() {
    return this.request('/wiki');
  },

  getWikiPage(slug) {
    return this.request(`/wiki/${slug}`);
  },

  saveWikiPage(slug, data) {
    return this.request(`/wiki/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteWikiPage(slug) {
    return this.request(`/wiki/${slug}`, { method: 'DELETE' });
  },

  searchWiki(query) {
    return this.request(`/wiki/search?q=${encodeURIComponent(query)}`);
  },

  // Boards
  getBoards() {
    return this.request('/boards');
  },

  // Skills
  getSkills() {
    return this.request('/skills');
  },

  getSkill(slug) {
    return this.request(`/skills/${slug}`);
  },

  saveSkill(slug, content) {
    return this.request(`/skills/${slug}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  deleteSkill(slug) {
    return this.request(`/skills/${slug}`, { method: 'DELETE' });
  },

  syncSkills() {
    return this.request('/skills/sync', { method: 'POST' });
  },
};

export default API;
