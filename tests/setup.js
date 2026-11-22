// Runs before every test file. Sets safe, test-only environment variables.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-only-for-automated-tests-0123456789";
process.env.BCRYPT_ROUNDS = "4"; // fast hashing in tests
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/taskflow_test";

// SAFETY: integration tests wipe collections. Refuse to run against a database whose name doesn't say "test".
const dbName = process.env.MONGODB_URI.split("?")[0].split("/").pop();
if (!/test/i.test(dbName)) {
  throw new Error(`Refusing to run tests: database name "${dbName}" must contain "test" (set MONGODB_URI_TEST).`);
}
