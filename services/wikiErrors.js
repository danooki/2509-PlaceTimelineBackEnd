// ─────────────────────────────────────────────────────────────
//  WikiErrors - Custom error classes for Wikipedia API
// ─────────────────────────────────────────────────────────────

export class WikiApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = "WikiApiError";
    this.code = code;
    this.status = status;
  }
}

export class WikiTimeoutError extends WikiApiError {
  constructor(message = "Wikipedia API timeout - please try again") {
    super(message, "TIMEOUT", 408);
    this.name = "WikiTimeoutError";
  }
}

export class WikiNotFoundError extends WikiApiError {
  constructor(query) {
    super(`No Wikipedia article found for "${query}"`, "NOT_FOUND", 404);
    this.name = "WikiNotFoundError";
  }
}
