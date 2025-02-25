import mongoose from "mongoose"; //7th part
import { TodoSchema } from "../Schema/TodoSchema.js";

export const TodoModel = mongoose.model("Todo", TodoSchema);
