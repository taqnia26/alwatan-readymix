// Synthetic session service only. Never replaces requireAdmin/requireSameOrigin.
export const sessionLookups = [];
export function resetSessions() { sessionLookups.length = 0; }
export function hashToken() { throw new Error("Session writes are outside this suite"); }
export async function getAdminFromToken(token) {
  sessionLookups.push(token);
  if (token === "service-error") throw new Error("Synthetic session service failure");
  const users = {
    administrator: { id: 101, role: "admin", isActive: true },
    visitor: { id: 102, role: "user", isActive: true },
    disabled: { id: 103, role: "admin", isActive: false },
    unprivileged: { id: 104, isActive: true },
    editor: { id: 105, role: "editor", isActive: true },
  };
  return users[token];
}
