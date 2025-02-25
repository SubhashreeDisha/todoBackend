import mongoose from "mongoose";

export const connectToDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://noob:noobhokya@cluster0.leavb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Successfully connect to mongodb");
  } catch (error) {
    console.log(error);
  }
};
