import mongoose from "mongoose"; //6th part

export const TodoSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId, //defining the type of the id of an object.
    ref: "user",
    required: true,
  },
  todo: [
    {
      task: {
        type: String,
        required: true,
      },
    },
  ],
});
