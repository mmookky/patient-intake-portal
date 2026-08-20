const demoSessionStorageKey = "patient-intake-portal:demo-session-id";

export function createDemoSessionId(): string {
  const sessionId = crypto.randomUUID();
  localStorage.setItem(demoSessionStorageKey, sessionId);
  return sessionId;
}

export function getDemoSessionId(): string {
  return localStorage.getItem(demoSessionStorageKey) ?? createDemoSessionId();
}
