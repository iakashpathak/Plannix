import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, minlength: 2, maxlength: 50 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: { type: String, required: true, minlength: 8, select: false }, // select:false => never returned by default
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

const rounds = () => Number(process.env.BCRYPT_ROUNDS) || 10;

// Hash only when the password field was set/changed. The plain password is never stored.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, rounds());
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model("User", userSchema);
