// validate(schema, "body" | "query" | "params") parses the request part with Zod.
// On success the *parsed* (trimmed / coerced / defaulted) value replaces the original.
// On failure Zod throws a ZodError which errorHandler converts into a 400 response.
export const validate = (schema, source = "body") => (req, _res, next) => {
  try {
    const parsed = schema.parse(req[source] ?? {});
    if (source === "query") {
      Object.defineProperty(req, "validatedQuery", { value: parsed, configurable: true });
    } else {
      req[source] = parsed;
    }
    next();
  } catch (err) {
    next(err);
  }
};
