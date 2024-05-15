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
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import jwt from "jsonwebtoken";
import Messages from "./schema/Messages";

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

// Handle preflight requests
app.options("*", cors()); // Respond to preflight requests

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

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      "https://g-talk.vercel.app",
    ],
    credentials: true,
  },
});

httpServer.listen(PORT, () => console.log(`Listening on port ${PORT}...`));

io.on(
  "connection",
  (
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
  ) => {
    console.log("socket connected (id): ", socket.id);

    let token = socket.handshake.headers.authorization;
    if (!token) {
      console.log("token is undefined.");
      return;
    }
    // remove the Bearer prefix
    token = token.replace(/Bearer\s+/i, "");

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const userId = decodedToken.userId;

    socket.on("join-room", (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on("messageToServer", async (message: any) => {
      // object to be pushed to the database.
      const dbMessageObj = {
        ...message,
        sender_id: userId,
      };

      // push object into Messages collection.
      const messages = new Messages(dbMessageObj);
      await messages.save();

      // send the dbMessageObj to friendId.
      // emit event to everyone in the room including the sender.
      // io.in(message.chat_id).emit("messageFromServer", dbMessageObj);
      io.emit("messageFromServer", dbMessageObj);
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected (id): ", socket.id);
    });
  }
);
