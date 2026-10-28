/** Postgres constraint name behind a (possibly wrapped) driver error. */
export function violatedConstraint(error: unknown): string | undefined {
  for (let e: unknown = error; e && typeof e === "object"; e = (e as { cause?: unknown }).cause) {
    const constraint = (e as { constraint?: unknown }).constraint;
    if (typeof constraint === "string") return constraint;
  }
}
