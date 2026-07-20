const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
  },
  { timestamps: true },
);

//used during signup or pasword changing
//Hash password before saving (only if it was modified)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  //generating salt
  const salt = await bcrypt.genSalt(10);
  //storing hash in db
  this.password = await bcrypt.hash(this.password, salt);
});

//used during login
//Instance method to compare plaintext password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
