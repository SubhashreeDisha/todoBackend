import cookie from "cookie";
import jwt from "jsonwebtoken";
import { UserModel } from "../Model/UserModel.js";
export const Authorisation = async (req) => {
  const cookiedata = req.headers.cookie;
  if (!cookiedata) {
    //req.user = null;

    return {
      user: null,
    };
  }
  // console.log(cookie.parse(cookiedata)); //so here to get the information about the user we first have to send the cookie from frontened to backened and encode it so that the backend could know that inside the encoded cookie which user information sshould be provided .
  const { todoapptoken } = cookie.parse(cookiedata); //destructuring it got the cookie value
  // console.log(jwt.decode(todoapptoken)); //decoding the cookie now
  const { id } = jwt.decode(todoapptoken); //getting userid from decode data.
  //now we will get the information of the user by using the userid in backened.

  const user = await UserModel.findById(id);
  //console.log(user);
  if (user) {
    return {
      user: user,
    };
  } else {
    return {
      user: null,
    };
  }
  //return req;
};
