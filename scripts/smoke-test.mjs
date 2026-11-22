// End-to-end smoke test against ANY running TaskFlow URL (local, Vite proxy, or your live Vercel site).
//   BASE_URL=http://localhost:5173 node scripts/smoke-test.mjs
//   BASE_URL=https://your-app.vercel.app node scripts/smoke-test.mjs
// It creates two throw-away users, exercises the main flows, and prints PASS/FAIL for each check.
const BASE = (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, "");
let failures = 0;

class Client {
  jar = {};
  async call(method, path, body) {
    const res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { "Content-Type": "application/json", Cookie: Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join("; ") },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    const raw = res.headers.getSetCookie?.() || [];
    for (const c of raw) {
      const [pair] = c.split(";");
      const [k, ...v] = pair.split("=");
      if (/Expires=Thu, 01 Jan 1970/i.test(c)) delete this.jar[k];
      else this.jar[k] = v.join("=");
    }
    let json = null;
    try { json = await res.json(); } catch {}
    return { status: res.status, body: json, setCookie: raw };
  }
}

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${detail}`}`);
  if (!ok) failures++;
}

const stamp = Date.now();
const a = new Client();
const b = new Client();
const creds = (n) => ({ name: `Smoke ${n}`, email: `smoke_${n}_${stamp}@example.com`, password: "Smoke1234pass" });

console.log(`Smoke testing ${BASE}\n`);

let r = await a.call("GET", "/health");
check("health endpoint responds", r.status === 200 && r.body?.data?.status === "ok", `status ${r.status}`);

r = await a.call("GET", "/health/db");
check("database connection works (/api/health/db)", r.status === 200 && r.body?.data?.database === "connected", `status ${r.status} ${JSON.stringify(r.body)}`);

r = await a.call("GET", "/projects");
check("protected route rejects anonymous request (401)", r.status === 401, `status ${r.status}`);

r = await a.call("POST", "/auth/register", creds("a"));
check("register user A (201)", r.status === 201, `status ${r.status} ${JSON.stringify(r.body)}`);
const cookie = r.setCookie.find((c) => c.startsWith("token="));
check("auth cookie is HttpOnly", /HttpOnly/i.test(cookie || ""), cookie);
if (BASE.startsWith("https://")) check("auth cookie is Secure on HTTPS", /;\s*Secure/i.test(cookie || ""), cookie);

r = await a.call("POST", "/auth/register", creds("a"));
check("duplicate email rejected (409)", r.status === 409, `status ${r.status}`);

r = await a.call("POST", "/auth/login", { email: creds("a").email, password: "wrong-password1" });
check("wrong password rejected (401)", r.status === 401, `status ${r.status}`);

r = await a.call("POST", "/auth/login", { email: creds("a").email, password: creds("a").password });
check("login works (200)", r.status === 200, `status ${r.status}`);

r = await a.call("GET", "/auth/me");
check("session restored via cookie (/auth/me)", r.status === 200 && r.body?.data?.user?.email === creds("a").email, `status ${r.status}`);

r = await a.call("POST", "/projects", { name: "Smoke project", description: "created by smoke test" });
check("create project (201)", r.status === 201, `status ${r.status} ${JSON.stringify(r.body)}`);
const projectId = r.body?.data?.project?._id;

r = await a.call("POST", "/tasks", { title: "Smoke task", project: projectId, priority: "High", dueDate: "2031-01-01" });
check("create task (201)", r.status === 201, `status ${r.status} ${JSON.stringify(r.body)}`);
const taskId = r.body?.data?.task?._id;

r = await a.call("PUT", `/tasks/${taskId}`, { status: "Completed" });
check("update task status (200)", r.status === 200 && r.body?.data?.task?.status === "Completed", `status ${r.status}`);

r = await a.call("GET", "/tasks?q=smoke&status=Completed");
check("search + filter finds the task", r.status === 200 && r.body?.data?.tasks?.length === 1, JSON.stringify(r.body));

r = await a.call("GET", "/dashboard");
check("dashboard stats are correct", r.body?.data?.stats?.totalTasks === 1 && r.body?.data?.stats?.completedTasks === 1, JSON.stringify(r.body?.data?.stats));

r = await b.call("POST", "/auth/register", creds("b"));
check("register user B (201)", r.status === 201, `status ${r.status}`);
r = await b.call("GET", `/projects/${projectId}`);
check("user B cannot read user A's project (404)", r.status === 404, `status ${r.status}`);
r = await b.call("PUT", `/tasks/${taskId}`, { title: "hacked" });
check("user B cannot edit user A's task (404)", r.status === 404, `status ${r.status}`);
r = await b.call("DELETE", `/projects/${projectId}`);
check("user B cannot delete user A's project (404)", r.status === 404, `status ${r.status}`);
r = await b.call("GET", "/admin/users");
check("normal user blocked from admin API (403)", r.status === 403, `status ${r.status}`);

r = await a.call("DELETE", `/projects/${projectId}`);
check("owner deletes project and its tasks (200)", r.status === 200 && r.body?.data?.deletedTasks === 1, JSON.stringify(r.body));

r = await a.call("POST", "/auth/logout");
check("logout (200)", r.status === 200, `status ${r.status}`);
r = await a.call("GET", "/auth/me");
check("session is gone after logout (401)", r.status === 401, `status ${r.status}`);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures ? 1 : 0);
