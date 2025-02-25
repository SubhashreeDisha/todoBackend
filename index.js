import http from "http";
import dotenv from "dotenv";
import { connectToDB } from "./Config/DB.js";
import { UserModel } from "./Model/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Authorisation } from "./Utils/Authorisation.js";
import { TodoModel } from "./Model/TodoModel.js";
import path from "path";
dotenv.config({ path: path.join(path.resolve(), "/Config/.env") });

const server = http.createServer((req, res) => {
  //
  res.setHeader("Access-Control-Allow-Origin", `${process.env.FRONTEND}`);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true"); //if it is true then cookies will recieve at backenedand and vice versa

  if (req.method === "OPTIONS") {
    //it is used to check wether the backened allowing the frontend origin or not
    res.end();
    return;
  } else if (req.method == "GET") {
    //(-------------------------------------------------1ST STEP-------------------------)
    if (req.url == "/") {
      res.end("ok");
    } //------------------------------------
    //logout
    else if (req.url == "/logout") {
      //(------------------------------------------4TH STEP---------------------------)
      //goes from backend to fontned
      res.setHeader(
        "Set-Cookie",
        `todoapptoken=${null}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`
      );
      res.end("logout Successfully");
    } //-----------------------------------------------------------------------------------
    //getting information of user after login succesfully with the help of cookies
    else if (req.url === "/Userinformation") {
      //(-------------------------------5TH STEP------------------------------------------------)
      Authorisation(req)
        .then(({ user }) => {
          if (user) {
            res.end(JSON.stringify(user));
          } else {
            res.end("user not found");
          }
        })
        .catch((error) => {
          res.end(JSON.stringify(error));
        });
    } //----------------------------------------------------------------------
    else if (req.url === "/allTodo") {
      //(-------------------------------5TH STEP------------------------------------------------)
      Authorisation(req)
        .then(async ({ user }) => {
          if (user) {
            const todos = await TodoModel.find({ userid: user._id });
            res.end(JSON.stringify(todos));
          } else {
            res.end("user not found");
          }
        })
        .catch((error) => {
          res.end(JSON.stringify(error));
        });
    } //----------------------------------------------------------------------
  } else if (req.method == "POST") {
    //(---------------------------------------2ND STEP-------------------------------)
    if (req.url == "/register") {
      req.on("data", async (data) => {
        //console.log(JSON.parse(data));
        try {
          let userData = JSON.parse(data); //geting data from post method

          const encryptedPassword = bcrypt.hashSync(userData.password, 10); //data encryptation for password
          userData = { ...userData, password: encryptedPassword };

          await UserModel.insertOne(userData); //then inserting userdata to usermodel to give data to mongodb

          res.end("user register sucessfully");
        } catch (error) {
          res.end(JSON.stringify(error));
        }
      }); //----------------------------------------------------
    } else if (req.url === "/login") {
      //(---------------------------------------------3RD STEP-------------------------------)
      req.on("data", async (data) => {
        try {
          // console.log(JSON.parse(data));

          //  let incomingData=JSON.parse(data);
          let { email, password } = JSON.parse(data); //frontened ru data destructure heiki asuchi
          //then we will check if the data coming from frontened by login user is registered or not(same to the database or not)
          // console.log(email, password);

          const isUser = await UserModel.findOne({ email: email }); //the first email is key and the second is the value of email which has been destructured coming from frontened.
          // console.log(isUser);
          if (!isUser) {
            res.end(JSON.stringify({ message: "invalid email or password" }));
            return;
          }
          const isPasswordMatching = bcrypt.compareSync(
            //for matching the password with encrypted database password
            password,
            isUser.password
          );
          if (!isPasswordMatching) {
            res.end(JSON.stringify({ message: "invalid email or password" }));
            return;
          }
          //console.log(isPasswordMatching);
          //for creating cookies

          //here token is created in backend and then from backened it has sent to frontend and store as cookies and then it will sent back to the backend(cookies) with each user request;
          const token = jwt.sign(
            { id: isUser.id },
            "gadhathupadhuchiuneducated",
            { expiresIn: "7d" }
          );
          // console.log(token);
          res.setHeader(
            "Set-Cookie",
            `todoapptoken=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=86408`
          );
          res.end(
            JSON.stringify({ message: "login Successfully", user: isUser })
          );
        } catch (error) {
          res.end(JSON.stringify(error));
        }
      });
    } else if (req.url == "/addtodo") {
      //8th part
      (async () => {
        //immediaite invoke function
        const { user } = await Authorisation(req); //trying to get the user
        //console.log(user);

        if (!user) {
          res.end("user not found");
        } else {
          req.on("data", async (data) => {
            try {
              //console.log(JSON.parse(data));
              let { task } = JSON.parse(data); //destructure
              const value = await TodoModel.findOneAndUpdate(
                { userid: user._id }, //find the records in the todo Schema
                { $push: { todo: { task: task } } }, //insert the task to the given userid
                { upsert: true, new: true } //it is given for creating a new  document if user adding the todo for first time(todo recrd ws not created for the first time)
              ); //upsert -if document is not there he will create it.
              //new-true--it return the document after the updation.
              //new-false--it return the document before the documentation.

              res.end(JSON.stringify(value));
            } catch (error) {
              res.end(JSON.stringify(error));
            }
          });
        }
      })();
    }
  } else if (req.method == "PATCH") {
    if (req.url == "/updateTodo") {
      try {
        (async () => {
          const { user } = await Authorisation(req);
          // console.log(user);
          if (!user) {
            res.end("user not found");
          } else {
            req.on("data", async (data) => {
              const { id, task } = JSON.parse(data);
              const value = await TodoModel.findOneAndUpdate(
                { $and: [{ userid: user._id }, { "todo._id": id }] },
                { $set: { "todo.$.task": task } },
                { new: true }
              );
              res.end(JSON.stringify(value));
            });
          }
        })();
      } catch (error) {
        res.end(JSON.stringify(error));
      }
    }
  } else if (req.method == "DELETE") {
    if (req.url == "/deleteTodo") {
      try {
        (async () => {
          const { user } = await Authorisation(req);
          // console.log(user);
          if (!user) {
            res.end("user not found");
          } else {
            req.on("data", async (data) => {
              const { id } = JSON.parse(data);
              const value = await TodoModel.findOneAndUpdate(
                { userid: user._id },
                { $pull: { todo: { _id: id } } },
                { new: true }
              );
              res.end(JSON.stringify(value));
            });
          }
        })();
      } catch (error) {
        res.end(JSON.stringify(error));
      }
    }
  }
}); //------------------------------------------------------------------------------

//connect to mongodb
connectToDB();

server.listen(process.env.PORT, process.env.HOST, () => {
  console.log(`http://${process.env.HOST}:${process.env.PORT}`);
});
