import * as dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";

// import routes
import authRouter from "./routes/auth";
import friendsRouter from "./routes/friends";
import chatRouter from "./routes/chat";
import friendRequestsRouter from "./routes/friendRequests";
import userRouter from "./routes/user";

const app = express();

dotenv.config();

app.use(express.json());
app.use(cookieParser());
// Allow requests from localhost:3000 (modify as needed)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      "https://g-talk.vercel.app",
    ],
    credentials: true,
  })
);

mongoose.connect(process.env.MONGO_URI!);

const db = mongoose.connection;
db.on("error", (error: any) => console.error(error));
db.on("open", () => console.log("Connected to MongoDB"));

// use routes.
app.use(authRouter);
app.use(userRouter);
app.use(friendsRouter);
app.use(friendRequestsRouter);
app.use(chatRouter);

// listen on port PORT and console log message.
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
