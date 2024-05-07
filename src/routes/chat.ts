import express from "express";
import verifyJWT from "../middlewares/verifyJWT";
import Chat from "../schema/Chat";
import mongoose, { ObjectId } from "mongoose";
import Messages from "../schema/Messages";
import User from "../schema/User";

interface CustomRequest extends express.Request {
  userId?: string;
}

const chatRouter = express.Router();

// get all pinned chats for the user.
chatRouter.get(
  "/chat",
  verifyJWT,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const userId = req.userId;

      // get all chats in Chat in which the participants array contains the userId
      let chats = await Chat.find({
        participants: { $in: [userId] },
      });

      if (!chats) {
        chats = [];
      }

      // we need the following:
      // from friend: friendId, firstName, lastName, profileImageUrl
      // from chat: conversation id, name, type

      // we'll be sending this.
      const responseArray = [];

      for (let chat of chats) {
        const { _id: conversationId, name, type, participants } = chat;

        if (type === "group") {
          // tell this feature isn't ready yet.
          res
            .status(400)
            .json({ message: "group chat feature is not ready yet" });
        }

        // identify the friend.
        const friendId = participants.find(
          (id: ObjectId) => id.toString() !== userId
        );

        // get details of friend.
        const friend = await User.findOne({ _id: friendId });

        if (!friend) {
          return res.status(400).json({ message: "friend not found" });
        }

        const { _id, firstName, lastName, profileImageUrl } = friend;

        responseArray.push({
          conversationId: conversationId.toString(),
          name,
          type,
          friendId: _id.toString(),
          friendFirstName: firstName,
          friendLastName: lastName,
          friendProfileImageUrl: profileImageUrl,
        });
      }

      res.status(200).json({ chats: responseArray });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// create a new conversation.
chatRouter.post(
  "/chat/create",
  verifyJWT,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const userId = req.userId;

      const { participants } = req.body;

      if (participants.length < 2 || !participants.includes(userId)) {
        return res.status(400).json({ message: "invalid participants" });
      }

      // first check whether a conversation already exists
      // where participants array contains the users of the
      // given participants array
      const existingChat = await Chat.findOne({
        participants: { $all: participants },
      });

      if (existingChat) {
        // return conversation id, name, type, and details of participants:
        // firstName, lastName, email, profileImageUrl.
        return res.status(200).json({
          userId: userId,
          chatId: existingChat._id.toString(),
          name: existingChat.name,
          type: existingChat.type,
          participants: await Promise.all(
            participants.map(async (participant: ObjectId) => {
              const user = await User.findOne({ _id: participant });
              return {
                participantId: user?._id.toString(),
                firstName: user?.firstName,
                lastName: user?.lastName,
                email: user?.email,
                profileImageUrl: user?.profileImageUrl,
              };
            })
          ),
        });
      }

      // create a new document in Chat
      let chat;
      try {
        chat = await Chat.create({
          name: req.body?.name,
          type: req.body?.type,
          participants: [...req.body.participants],
        });
      } catch (error: any) {
        if (error instanceof mongoose.Error.ValidationError) {
          return res.status(400).json({ message: error.message });
        } else if (error instanceof mongoose.Error.CastError) {
          return res.status(400).json({ message: error.message });
        } else if (error instanceof mongoose.Error.VersionError) {
          return res.status(400).json({ message: error.message });
        } else {
          return res.status(500).json({ message: error.message });
        }
      }

      // return conversation id, name, type, and details of participants:
      // firstName, lastName, email, profileImageUrl.
      res.status(200).json({
        userId: userId,
        chatId: chat._id.toString(),
        name: chat.name,
        type: chat.type,
        participants: await Promise.all(
          participants.map(async (participant: ObjectId) => {
            const user = await User.findOne({ _id: participant });
            return {
              participantId: user?._id.toString(),
              firstName: user?.firstName,
              lastName: user?.lastName,
              email: user?.email,
              profileImageUrl: user?.profileImageUrl,
            };
          })
        ),
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// get a single chat for the user
chatRouter.get(
  "/chat/:chatId",
  verifyJWT,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const userId = req.userId;
      const { chatId } = req.params;

      // check if chat with chatId exists in Chat
      const chat = await Chat.findOne({
        _id: new mongoose.Types.ObjectId(chatId),
        participants: { $in: [userId] },
      });

      if (!chat) {
        return res.status(400).json({ message: "chat not found" });
      }

      // get all messages associated with the chat _id
      let messages = await Messages.find({
        chat_id: new mongoose.Types.ObjectId(chatId),
      });

      if (!messages) {
        messages = [];
      }

      res.status(200).json({ messages });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// unpin and clear a chat: TODO

export default chatRouter;
