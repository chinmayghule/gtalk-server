import express from "express";
import User from "../schema/User";
import { compareHash, generateToken, hashString } from "../helpers";
import verifyJWT from "../middlewares/verifyJWT";
import mongoose from "mongoose";
import Friends from "../schema/Friends";

interface CustomRequest extends express.Request {
  userId?: string;
}

const authRouter = express.Router();

//signup
authRouter.post("/signup", async (req, res) => {
  type RequestBody = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };

  // get email and password from body
  const { firstName, lastName, email, password } = req.body as RequestBody;

  console.log(firstName, lastName, email, password);

  try {
    // Check for existing email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // email does not exist in db so we can safely proceed
    const hashedPassword = await hashString(password);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // created new user in database
    await newUser.save();
    console.log("User created: ", newUser);

    // create a new document in friends collection
    const newFriend = new Friends({
      user_id: newUser._id,
      friends: [],
    });

    await newFriend.save();

    // generate JWT with user id
    const token = await generateToken(newUser._id.toString());

    // set cookie with httpOnly flag
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    // set regular object containing user info:
    // { firstName, lastName, email }
    const userInfo = {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
    };

    res.cookie("userInfo", JSON.stringify(userInfo), {
      httpOnly: false,
      secure: true,
      sameSite: "none",
    });

    res.status(201).json({ message: "user created successfully" });
  } catch (error: any) {
    console.log("Could not create user", error);
    res.status(400).json({ message: "user could not be created" });
  }
});

//login
authRouter.post("/login", async (req, res) => {
  // get email and password from body
  const { email, password } = req.body;

  console.log(email, password);
  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(400)
      .json({ message: "user not found, email might be incorrect" });
  }

  const isPasswordValid = await compareHash(password, user.password);

  if (isPasswordValid) {
    // generate JWT with user id
    const token = await generateToken(user._id.toString());

    // set cookie with httpOnly flag
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    // set regular object containing user info:
    // { firstName, lastName, email }
    const userInfo = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };

    res.cookie("userInfo", JSON.stringify(userInfo), {
      httpOnly: false,
      sameSite: "none",
      secure: true,
    });

    return res.status(200).json({ message: "login sucessful" });
  }

  res.status(400).json({ message: "incorrect password" });
});

// logout
authRouter.get(
  "/logout",
  verifyJWT,
  (req: express.Request, res: express.Response) => {
    res.cookie("token", "", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      expires: new Date(0),
    });
    res.cookie("userInfo", "", {
      httpOnly: false,
      sameSite: "none",
      secure: true,
      expires: new Date(0),
    });
    res.status(200).json({ message: "logout successful" });
  }
);

// get current user
authRouter.get(
  "/user",
  verifyJWT,
  async (req: CustomRequest, res: express.Response) => {
    try {
      // get user id from token
      const userId = req.userId;

      // get user info from User except password
      const user = await User.findOne({
        _id: new mongoose.Types.ObjectId(userId),
      }).select("-password");

      // if user not found, remove the token and send error
      if (!user) {
        res.clearCookie("token");
        res.clearCookie("userInfo");
        return res.status(400).json({ message: "user not found" });
      }

      res.status(200).json({ user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default authRouter;
