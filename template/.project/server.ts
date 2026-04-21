// Git-native project management server
// Usage: deno run --allow-net --allow-read --allow-write --allow-env server.ts

// Load .env file
await loadEnv();

const args = parseArgs(Deno.args);
const PROJECT_DIR = resolve(args.project || Deno.env.get("PROJECT_DIR") || "./.project");
const PORT = parseInt(args.port || Deno.env.get("PORT") || "8000");
const UI_DIR = resolve(new URL(".", import.meta.url).pathname, "ui");
const CURRENT_USER = Deno.env.get("PROJECT_USER") || "";
const CURRENT_SLUG = Deno.env.get("PROJECT_SLUG") || "";

async function loadEnv() {
  try {
    const text = await Deno.readTextFile(".env");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      // Don't override existing env vars
      if (!Deno.env.get(key)) {
        Deno.env.set(key, val);
      }
    }
  } catch {
    // No .env file — that's fine
  }
}

// --- Helpers ---

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      result[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return result;
}

function resolve(...parts: string[]): string {
  // Use Deno's path resolution
  let path = parts.join("/");
  if (!path.startsWith("/")) {
    path = Deno.cwd() + "/" + path;
  }
  // Normalize
  const segments: string[] = [];
  for (const seg of path.split("/")) {
    if (seg === "..") segments.pop();
    else if (seg !== "." && seg !== "") segments.push(seg);
  }
  return "/" + segments.join("/");
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function cors(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function error(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}

async function readJson(path: string): Promise<unknown> {
  const text = await Deno.readTextFile(path);
  return JSON.parse(text);
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await Deno.writeTextFile(path, JSON.stringify(data, null, 2) + "\n");
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (e) {
    if (!(e instanceof Deno.errors.AlreadyExists)) throw e;
  }
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// --- Config ---

async function getConfig(): Promise<Record<string, unknown>> {
  return (await readJson(`${PROJECT_DIR}/config.json`)) as Record<string, unknown>;
}

async function saveConfig(config: Record<string, unknown>): Promise<void> {
  await writeJson(`${PROJECT_DIR}/config.json`, config);
}

// --- User Slug Resolution ---

async function getCurrentUserSlug(): Promise<string> {
  // 1. Use PROJECT_SLUG env var if set
  if (CURRENT_SLUG) return CURRENT_SLUG;

  // 2. Look up slug by email in config team array
  if (CURRENT_USER) {
    const config = await getConfig();
    const team = (config.team as { email: string; slug?: string }[]) || [];
    const member = team.find((m) => m.email === CURRENT_USER);
    if (member?.slug) return member.slug;
  }

  throw new Error(
    "No user slug configured. Set PROJECT_SLUG in .env or add a 'slug' field to your team entry in .project/config.json. " +
    "Run init.sh --update to set up your identity."
  );
}

async function getUserCounter(slug: string): Promise<{ nextId: number }> {
  const counterPath = `${PROJECT_DIR}/counters/${slug}.json`;
  if (await exists(counterPath)) {
    return (await readJson(counterPath)) as { nextId: number };
  }
  return { nextId: 1 };
}

async function saveUserCounter(slug: string, counter: { nextId: number }): Promise<void> {
  await ensureDir(`${PROJECT_DIR}/counters`);
  await writeJson(`${PROJECT_DIR}/counters/${slug}.json`, counter);
}

// --- Issues Index ---

const INDEX_FILE = `${PROJECT_DIR}/issues_index.json`;

function issueToIndexEntry(issue: Record<string, unknown>): Record<string, unknown> {
  const { id, title, type, status, priority, assignee, labels, parent, related, created, updated } = issue;
  return { id, title, type, status, priority, assignee, labels, parent, related: related || [], created, updated };
}

async function writeIndex(entries: Record<string, unknown>[]): Promise<void> {
  entries.sort((a: any, b: any) => (b.updated as string).localeCompare(a.updated as string));
  await writeJson(INDEX_FILE, entries);
}

async function rebuildIndex(): Promise<Record<string, unknown>[]> {
  const issuesDir = `${PROJECT_DIR}/issues`;
  const entries: Record<string, unknown>[] = [];
  if (await exists(issuesDir)) {
    for await (const entry of Deno.readDir(issuesDir)) {
      if (!entry.isDirectory) continue;
      const issuePath = `${issuesDir}/${entry.name}/issue.json`;
      if (await exists(issuePath)) {
        const issue = (await readJson(issuePath)) as Record<string, unknown>;
        entries.push(issueToIndexEntry(issue));
      }
    }
  }
  await writeIndex(entries);
  return entries;
}

async function readIndex(): Promise<Record<string, unknown>[]> {
  try {
    if (await exists(INDEX_FILE)) {
      return (await readJson(INDEX_FILE)) as Record<string, unknown>[];
    }
  } catch {
    // Corrupt index — rebuild
  }
  return await rebuildIndex();
}

async function updateIndexEntry(issue: Record<string, unknown>): Promise<void> {
  const entries = await readIndex();
  const filtered = entries.filter((e: any) => e.id !== issue.id);
  filtered.push(issueToIndexEntry(issue));
  await writeIndex(filtered);
}

async function removeIndexEntry(id: string): Promise<void> {
  const entries = await readIndex();
  await writeIndex(entries.filter((e: any) => e.id !== id));
}

// --- Issues ---

async function listIssues(): Promise<unknown[]> {
  const entries = await readIndex();
  return entries.sort((a: any, b: any) => (a.id as string).localeCompare(b.id as string, undefined, { numeric: true }));
}

async function getIssue(id: string): Promise<Record<string, unknown> | null> {
  const dir = `${PROJECT_DIR}/issues/${id}`;
  if (!(await exists(`${dir}/issue.json`))) return null;

  const issue = (await readJson(`${dir}/issue.json`)) as Record<string, unknown>;

  // Read description
  const descPath = `${dir}/description.md`;
  issue.description = (await exists(descPath)) ? await Deno.readTextFile(descPath) : "";

  // Read comments
  const commentsDir = `${dir}/comments`;
  const comments: unknown[] = [];
  if (await exists(commentsDir)) {
    for await (const entry of Deno.readDir(commentsDir)) {
      if (entry.name.endsWith(".json")) {
        comments.push(await readJson(`${commentsDir}/${entry.name}`));
      }
    }
  }
  issue.comments = comments.sort((a: any, b: any) => (a.created ?? a.id ?? "").localeCompare(b.created ?? b.id ?? ""));

  return issue;
}

async function createIssue(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const config = await getConfig();
  const prefix = config.prefix as string;
  const slug = await getCurrentUserSlug();
  const counter = await getUserCounter(slug);
  const id = `${prefix}-${slug}-${counter.nextId}`;

  const issue = {
    id,
    title: data.title || "Untitled",
    type: data.type || "task",
    status: data.status || "backlog",
    priority: data.priority || "medium",
    assignee: data.assignee || null,
    labels: data.labels || [],
    parent: data.parent || null,
    related: data.related || [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  const dir = `${PROJECT_DIR}/issues/${id}`;
  await ensureDir(`${dir}/comments`);
  await writeJson(`${dir}/issue.json`, issue);
  await Deno.writeTextFile(`${dir}/description.md`, (data.description as string) || `# ${issue.title}\n`);

  counter.nextId++;
  await saveUserCounter(slug, counter);
  await updateIndexEntry(issue);

  return issue;
}

async function updateIssue(id: string, data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const path = `${PROJECT_DIR}/issues/${id}/issue.json`;
  if (!(await exists(path))) return null;

  const issue = (await readJson(path)) as Record<string, unknown>;
  const allowed = ["title", "type", "status", "priority", "assignee", "labels", "parent", "related"];
  for (const key of allowed) {
    if (key in data) issue[key] = data[key];
  }
  issue.updated = new Date().toISOString();
  await writeJson(path, issue);
  await updateIndexEntry(issue);
  return issue;
}

async function updateDescription(id: string, content: string): Promise<boolean> {
  const path = `${PROJECT_DIR}/issues/${id}/description.md`;
  const dir = `${PROJECT_DIR}/issues/${id}`;
  if (!(await exists(dir))) return false;
  await Deno.writeTextFile(path, content);
  // Update timestamp
  const issuePath = `${dir}/issue.json`;
  const issue = (await readJson(issuePath)) as Record<string, unknown>;
  issue.updated = new Date().toISOString();
  await writeJson(issuePath, issue);
  await updateIndexEntry(issue);
  return true;
}

async function addComment(id: string, data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const dir = `${PROJECT_DIR}/issues/${id}`;
  if (!(await exists(dir))) return null;

  const commentsDir = `${dir}/comments`;
  await ensureDir(commentsDir);

  // Find next comment number
  let maxNum = 0;
  if (await exists(commentsDir)) {
    for await (const entry of Deno.readDir(commentsDir)) {
      const num = parseInt(entry.name.replace(".json", ""));
      if (num > maxNum) maxNum = num;
    }
  }

  const comment: Record<string, unknown> = {
    id: String(maxNum + 1).padStart(3, "0"),
    author: data.author || "anonymous",
    content: data.content || "",
    created: new Date().toISOString(),
  };
  if (data.type === "todo") {
    comment.type = "todo";
    comment.done = data.done ?? false;
  }

  await writeJson(`${commentsDir}/${comment.id}.json`, comment);

  // Update issue timestamp
  const issuePath = `${dir}/issue.json`;
  const issue = (await readJson(issuePath)) as Record<string, unknown>;
  issue.updated = new Date().toISOString();
  await writeJson(issuePath, issue);
  await updateIndexEntry(issue);

  return comment;
}

async function updateComment(issueId: string, commentId: string, data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const commentPath = `${PROJECT_DIR}/issues/${issueId}/comments/${commentId}.json`;
  if (!(await exists(commentPath))) return null;
  const comment = (await readJson(commentPath)) as Record<string, unknown>;
  if ("done" in data) comment.done = data.done;
  if ("content" in data) comment.content = data.content;
  await writeJson(commentPath, comment);
  return comment;
}

async function getTodos(): Promise<unknown[]> {
  const issuesDir = `${PROJECT_DIR}/issues`;
  const todos: unknown[] = [];
  if (!(await exists(issuesDir))) return todos;

  for await (const entry of Deno.readDir(issuesDir)) {
    if (!entry.isDirectory) continue;
    const issueId = entry.name;
    const issuePath = `${issuesDir}/${issueId}/issue.json`;
    const commentsDir = `${issuesDir}/${issueId}/comments`;
    if (!(await exists(issuePath)) || !(await exists(commentsDir))) continue;

    const issue = (await readJson(issuePath)) as Record<string, unknown>;

    for await (const cEntry of Deno.readDir(commentsDir)) {
      if (!cEntry.name.endsWith(".json")) continue;
      const comment = (await readJson(`${commentsDir}/${cEntry.name}`)) as Record<string, unknown>;
      if (comment.type === "todo") {
        todos.push({
          ...comment,
          issueId: issue.id,
          issueTitle: issue.title,
          issueStatus: issue.status,
        });
      }
    }
  }

  todos.sort((a: any, b: any) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.created.localeCompare(a.created);
  });

  return todos;
}

async function deleteIssue(id: string): Promise<boolean> {
  const dir = `${PROJECT_DIR}/issues/${id}`;
  if (!(await exists(dir))) return false;
  await Deno.remove(dir, { recursive: true });
  await removeIndexEntry(id);
  return true;
}

// --- Wiki ---

async function getWikiIndex(): Promise<unknown> {
  const path = `${PROJECT_DIR}/wiki/_index.json`;
  if (!(await exists(path))) return { pages: [] };
  return await readJson(path);
}

async function getWikiPage(slug: string): Promise<{ slug: string; title: string; content: string } | null> {
  const path = `${PROJECT_DIR}/wiki/pages/${slug}.md`;
  if (!(await exists(path))) return null;

  const index = (await getWikiIndex()) as { pages: { slug: string; title: string }[] };
  const entry = index.pages.find((p) => p.slug === slug);

  return {
    slug,
    title: entry?.title || slug,
    content: await Deno.readTextFile(path),
  };
}

async function saveWikiPage(slug: string, data: { title?: string; content: string; parent?: string | null }): Promise<void> {
  await ensureDir(`${PROJECT_DIR}/wiki/pages`);
  await Deno.writeTextFile(`${PROJECT_DIR}/wiki/pages/${slug}.md`, data.content);

  // Update index
  const indexPath = `${PROJECT_DIR}/wiki/_index.json`;
  const index = (await exists(indexPath))
    ? ((await readJson(indexPath)) as { pages: { slug: string; title: string; order: number; parent?: string | null }[] })
    : { pages: [] };

  const parentValue = data.parent || null;

  const existing = index.pages.find((p) => p.slug === slug);
  if (existing) {
    if (data.title) existing.title = data.title;
    if ("parent" in data) existing.parent = parentValue;
  } else {
    // For new pages, calculate order among siblings
    const siblings = index.pages.filter((p) => (p.parent || null) === parentValue);
    const maxOrder = siblings.reduce((max, p) => Math.max(max, p.order || 0), 0);
    index.pages.push({ slug, title: data.title || slug, order: maxOrder + 1, parent: parentValue });
  }
  await writeJson(indexPath, index);
}

async function deleteWikiPage(slug: string): Promise<boolean> {
  const path = `${PROJECT_DIR}/wiki/pages/${slug}.md`;
  if (!(await exists(path))) return false;
  await Deno.remove(path);

  // Remove from index
  const indexPath = `${PROJECT_DIR}/wiki/_index.json`;
  if (await exists(indexPath)) {
    const index = (await readJson(indexPath)) as { pages: { slug: string }[] };
    index.pages = index.pages.filter((p) => p.slug !== slug);
    await writeJson(indexPath, index);
  }
  return true;
}

// --- Boards ---

async function getBoards(): Promise<unknown[]> {
  const dir = `${PROJECT_DIR}/boards`;
  if (!(await exists(dir))) return [];
  const boards: unknown[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.name.endsWith(".json")) {
      boards.push(await readJson(`${dir}/${entry.name}`));
    }
  }
  return boards;
}

// --- Static files ---

async function serveStatic(path: string): Promise<Response> {
  // Default to index.html
  if (path === "/" || path === "") path = "/index.html";

  const filePath = `${UI_DIR}${path}`;

  try {
    const content = await Deno.readFile(filePath);
    const ext = path.substring(path.lastIndexOf("."));
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    return new Response(content, {
      headers: { "Content-Type": contentType, "Access-Control-Allow-Origin": "*" },
    });
  } catch {
    // SPA fallback: serve index.html for non-API routes
    if (!path.includes(".")) {
      try {
        const content = await Deno.readFile(`${UI_DIR}/index.html`);
        return new Response(content, {
          headers: { "Content-Type": "text/html", "Access-Control-Allow-Origin": "*" },
        });
      } catch {
        return error("Not found", 404);
      }
    }
    return error("Not found", 404);
  }
}

// --- Router ---

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === "OPTIONS") return cors();

  try {
    // API routes
    if (path.startsWith("/api/")) {
      return await handleApi(method, path, req);
    }

    // Static files
    return await serveStatic(path);
  } catch (e) {
    console.error("Error:", e);
    return error("Internal server error", 500);
  }
}

async function handleApi(method: string, path: string, req: Request): Promise<Response> {
  // Current user
  if (path === "/api/me" && method === "GET") {
    return json({ email: CURRENT_USER, slug: CURRENT_SLUG });
  }

  // Config
  if (path === "/api/config" && method === "GET") {
    return json(await getConfig());
  }

  // Issues
  // Todos
  if (path === "/api/todos" && method === "GET") {
    return json(await getTodos());
  }

  if (path === "/api/issues" && method === "GET") {
    return json(await listIssues());
  }

  if (path === "/api/issues" && method === "POST") {
    const data = await req.json();
    return json(await createIssue(data), 201);
  }

  const issueMatch = path.match(/^\/api\/issues\/([A-Z][A-Za-z0-9-]+-\d+)$/);
  if (issueMatch) {
    const id = issueMatch[1];
    if (method === "GET") {
      const issue = await getIssue(id);
      return issue ? json(issue) : error("Not found", 404);
    }
    if (method === "PUT") {
      const data = await req.json();
      const issue = await updateIssue(id, data);
      return issue ? json(issue) : error("Not found", 404);
    }
    if (method === "DELETE") {
      return (await deleteIssue(id)) ? json({ ok: true }) : error("Not found", 404);
    }
  }

  const descMatch = path.match(/^\/api\/issues\/([A-Z][A-Za-z0-9-]+-\d+)\/description$/);
  if (descMatch && method === "PUT") {
    const { content } = await req.json();
    return (await updateDescription(descMatch[1], content)) ? json({ ok: true }) : error("Not found", 404);
  }

  const commentUpdateMatch = path.match(/^\/api\/issues\/([A-Z][A-Za-z0-9-]+-\d+)\/comments\/(\d+)$/);
  if (commentUpdateMatch && method === "PUT") {
    const data = await req.json();
    const comment = await updateComment(commentUpdateMatch[1], commentUpdateMatch[2], data);
    return comment ? json(comment) : error("Not found", 404);
  }

  const commentMatch = path.match(/^\/api\/issues\/([A-Z][A-Za-z0-9-]+-\d+)\/comments$/);
  if (commentMatch && method === "POST") {
    const data = await req.json();
    const comment = await addComment(commentMatch[1], data);
    return comment ? json(comment, 201) : error("Not found", 404);
  }

  if (path === "/api/issues/rebuild-index" && method === "POST") {
    const entries = await rebuildIndex();
    return json({ ok: true, count: entries.length });
  }

  // Wiki
  if (path === "/api/wiki" && method === "GET") {
    return json(await getWikiIndex());
  }

  if (path === "/api/wiki/search" && method === "GET") {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").toLowerCase().trim();
    if (!q) return json({ results: [] });

    const index = (await getWikiIndex()) as { pages: { slug: string; title: string; parent?: string | null }[] };
    const results: { slug: string; title: string; snippet: string }[] = [];

    for (const page of index.pages) {
      const titleMatch = page.title.toLowerCase().includes(q);
      let contentMatch = false;
      let snippet = "";

      try {
        const content = await Deno.readTextFile(`${PROJECT_DIR}/wiki/pages/${page.slug}.md`);
        const lower = content.toLowerCase();
        const idx = lower.indexOf(q);
        if (idx >= 0) {
          contentMatch = true;
          const start = Math.max(0, idx - 40);
          const end = Math.min(content.length, idx + q.length + 40);
          snippet = (start > 0 ? "..." : "") + content.slice(start, end).replace(/\n/g, " ") + (end < content.length ? "..." : "");
        }
      } catch { /* page file missing */ }

      if (titleMatch || contentMatch) {
        results.push({ slug: page.slug, title: page.title, snippet: snippet || page.title });
      }
    }

    return json({ results });
  }

  const wikiMatch = path.match(/^\/api\/wiki\/([a-z0-9-]+)$/);
  if (wikiMatch) {
    const slug = wikiMatch[1];
    if (method === "GET") {
      const page = await getWikiPage(slug);
      return page ? json(page) : error("Not found", 404);
    }
    if (method === "PUT") {
      const data = await req.json();
      await saveWikiPage(slug, data);
      return json({ ok: true });
    }
    if (method === "DELETE") {
      return (await deleteWikiPage(slug)) ? json({ ok: true }) : error("Not found", 404);
    }
  }

  // Boards
  if (path === "/api/boards" && method === "GET") {
    return json(await getBoards());
  }

  // Skills (directory-based: skills/{name}/SKILL.md)
  if (path === "/api/skills" && method === "GET") {
    const dir = `${PROJECT_DIR}/skills`;
    const skills: { slug: string; name: string; description: string; content: string; frontmatter: Record<string, string> }[] = [];
    try {
      for await (const entry of Deno.readDir(dir)) {
        if (!entry.isDirectory) continue;
        const skillPath = `${dir}/${entry.name}/SKILL.md`;
        try {
          const raw = await Deno.readTextFile(skillPath);
          const slug = entry.name;
          let name = slug;
          let description = "";
          let content = raw;
          const frontmatter: Record<string, string> = {};
          const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
          if (fmMatch) {
            const fm = fmMatch[1];
            content = fmMatch[2].trim();
            for (const line of fm.split("\n")) {
              const m = line.match(/^([a-z-]+):\s*(.+)$/);
              if (m) frontmatter[m[1]] = m[2].trim();
            }
            if (frontmatter.name) name = frontmatter.name;
            if (frontmatter.description) description = frontmatter.description;
          }
          skills.push({ slug, name, description, content, frontmatter });
        } catch { /* SKILL.md missing */ }
      }
    } catch { /* no skills dir */ }
    return json({ skills });
  }

  if (path === "/api/skills/sync" && method === "POST") {
    await syncSkills();
    return json({ ok: true });
  }

  const skillMatch = path.match(/^\/api\/skills\/([a-z0-9-]+)$/);
  if (skillMatch) {
    const slug = skillMatch[1];
    const skillDir = `${PROJECT_DIR}/skills/${slug}`;
    const filePath = `${skillDir}/SKILL.md`;

    if (method === "GET") {
      try {
        const raw = await Deno.readTextFile(filePath);
        return json({ slug, content: raw });
      } catch {
        return error("Not found", 404);
      }
    }

    if (method === "PUT") {
      await ensureDir(skillDir);
      const data = await req.json();
      await Deno.writeTextFile(filePath, data.content);
      return json({ ok: true });
    }

    if (method === "DELETE") {
      try {
        await Deno.remove(skillDir, { recursive: true });
        return json({ ok: true });
      } catch {
        return error("Not found", 404);
      }
    }
  }

  return error("Not found", 404);
}

// --- Sync skills to .claude/skills/ ---

async function syncSkills() {
  const projectSkillsDir = `${PROJECT_DIR}/skills`;
  // Find the repo root (parent of .project)
  const repoRoot = PROJECT_DIR.replace(/\/?\.project\/?$/, "");
  const claudeSkillsDir = `${repoRoot}/.claude/skills`;

  try {
    await ensureDir(claudeSkillsDir);
    let count = 0;

    for await (const entry of Deno.readDir(projectSkillsDir)) {
      if (!entry.isDirectory) continue;
      const skillFile = `${projectSkillsDir}/${entry.name}/SKILL.md`;
      try {
        await Deno.stat(skillFile); // verify SKILL.md exists
      } catch {
        continue; // skip dirs without SKILL.md
      }

      const source = `${projectSkillsDir}/${entry.name}`;
      const target = `${claudeSkillsDir}/${entry.name}`;

      // Remove existing (symlink or dir) and create fresh symlink
      try { await Deno.remove(target, { recursive: true }); } catch { /* doesn't exist */ }
      try {
        await Deno.symlink(source, target);
        count++;
      } catch {
        // Fallback: copy directory if symlink not supported
        await ensureDir(target);
        await Deno.copyFile(skillFile, `${target}/SKILL.md`);
        count++;
      }
    }

    console.log(`  🔗 Synced ${count} skill(s) to .claude/skills/`);
  } catch {
    // No skills dir yet — that's fine
  }
}

await syncSkills();

// --- Start server ---

// Rebuild issues index on every startup to ensure consistency
await rebuildIndex();

const MAX_PORT_ATTEMPTS = 20;
let activePort = PORT;
let server: Deno.HttpServer | null = null;

for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt++) {
  const candidate = PORT + attempt;
  try {
    server = Deno.serve({
      port: candidate,
      onListen: ({ port, hostname }) => {
        activePort = port;
        if (attempt > 0) {
          console.log(`\n  ⚠️  Port ${PORT} was in use — using port ${port} instead`);
        }
        console.log(`\n  🚀 Project Manager running at http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}`);
        console.log(`  📁 Project dir: ${PROJECT_DIR}\n`);
      },
    }, handleRequest);
    break;
  } catch (err) {
    if (err instanceof Deno.errors.AddrInUse) {
      console.log(`  ⏳ Port ${candidate} in use, trying ${candidate + 1}...`);
      continue;
    }
    throw err;
  }
}

if (!server) {
  console.error(`\n  ❌ Could not find a free port in range ${PORT}-${PORT + MAX_PORT_ATTEMPTS - 1}`);
  Deno.exit(1);
}
