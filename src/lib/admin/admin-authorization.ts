export class AdminAuthorizationError extends Error {
  constructor(message = "No autorizado.") {
    super(message);
    this.name = "AdminAuthorizationError";
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getConfiguredAdminEmails(rawAdminEmails: string | undefined) {
  return new Set(
    (rawAdminEmails ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean),
  );
}

export function getAdminAuthorizationDecision(
  email: string | null | undefined,
  rawAdminEmails: string | undefined,
) {
  const normalizedEmail = email ? normalizeEmail(email) : null;
  const configuredEmails = getConfiguredAdminEmails(rawAdminEmails);

  return {
    email: normalizedEmail,
    isAuthorized:
      normalizedEmail !== null && configuredEmails.has(normalizedEmail),
  };
}

export function assertAdminEmailAllowed(
  email: string | null | undefined,
  rawAdminEmails: string | undefined,
) {
  const decision = getAdminAuthorizationDecision(email, rawAdminEmails);

  if (!decision.isAuthorized || !decision.email) {
    throw new AdminAuthorizationError();
  }

  return decision.email;
}
