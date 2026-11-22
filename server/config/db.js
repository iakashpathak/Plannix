import mongoose from "mongoose";

// Serverless functions may be frozen/reused between requests. We cache the connection promise on `global`
// so warm invocations reuse it, and cold starts open exactly one connection.
const cache = global.__taskflowMongoose || (global.__taskflowMongoose = { promise: null });

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const err = new Error("MONGODB_URI is not set. Add it to .env (local) or Vercel Environment Variables.");
    err.code = "NO_MONGODB_URI";
    throw err;
  }

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000, bufferCommands: false })
      .catch((err) => {
        cache.promise = null; // allow retry on the next request
        throw err;
      });
  }
  await cache.promise;
  return mongoose.connection;
}

export async function disconnectDB() {
  cache.promise = null;
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
