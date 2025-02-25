import mongoose from "mongoose";
import { UserSchema } from "../Schema/UserSchema.js";

export const UserModel = mongoose.model("user", UserSchema);
