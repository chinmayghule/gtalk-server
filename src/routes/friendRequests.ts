import express from "express";
import verifyJWT from "../middlewares/verifyJWT";
import Friends from "../schema/Friends";
import FriendRequests from "../schema/FriendRequests";
import User from "../schema/User";

interface CustomRequest extends express.Request {
  userId?: string;
}

const friendRequestsRouter = express.Router();

// get all friend requests.
friendRequestsRouter.get(
  "/friendRequests",
  verifyJWT,
  async (req: CustomRequest, res: express.Response) => {
    type ResponseFriendRequest = {
      friendRequestId: string;
      sender_id: string;
      receiver_id: string;
      friendFirstName: string;
      friendLastName: string;
      friendProfileImageUrl: string | undefined;
      friendEmail: string;
    };

    // this is what we'll be sending back.
    const responseFriendRequests: ResponseFriendRequest[] = [];

    try {
      const userId = req.userId;

      // get all friend requests where userId === receiverId or userId === senderId
      const friendRequests = await FriendRequests.find({
        $or: [{ sender_id: userId }, { receiver_id: userId }],
      });

      if (!friendRequests) {
        return res.status(400).json({ message: "no friend requests found" });
      }

      for (const friendRequest of friendRequests) {
        const { _id, sender_id, receiver_id } = friendRequest;

        // check which id is not the userId
        const otherUserId =
          sender_id.toString() === userId ? receiver_id : sender_id;

        // get the other user.
        const otherUser = await User.findOne({ _id: otherUserId });

        const responseFriendRequest: ResponseFriendRequest = {
          friendRequestId: _id.toString(),
          sender_id: sender_id.toString(),
          receiver_id: receiver_id.toString(),
          friendFirstName: otherUser?.firstName || "",
          friendLastName: otherUser?.lastName || "",
          friendProfileImageUrl: otherUser?.profileImageUrl || undefined,
          friendEmail: otherUser?.email || "",
        };

        responseFriendRequests.push(responseFriendRequest);
      }

      return res.status(200).json({ userId, responseFriendRequests });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// send friend request
friendRequestsRouter.post(
  "/friendRequests",
  verifyJWT,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const userId = req.userId;

      const { receiverId } = req.body;

      if (!receiverId) {
        return res.status(400).json({ message: "receiver id is required" });
      }

      if (userId === receiverId) {
        return res
          .status(400)
          .json({ message: "cannot send friend request to yourself" });
      }

      // check whether the receiver_id exists in User
      const receiver = await User.findOne({ _id: receiverId });

      if (!receiver) {
        return res.status(400).json({ message: "receiver not found" });
      }

      // check if the receiver is already a friend
      const userWithFriends = await Friends.findOne({
        user_id: userId,
      });

      const doesFriendAlreadyExist =
        userWithFriends?.friends.includes(receiverId);

      if (doesFriendAlreadyExist) {
        return res.status(400).json({ message: "friend already exists" });
      }

      // check if a friend request already exists.
      const friendRequest = await FriendRequests.findOne({
        $or: [
          { sender_id: userId, receiver_id: receiverId },
          { sender_id: receiverId, receiver_id: userId },
        ],
      });

      if (friendRequest) {
        return res
          .status(400)
          .json({ message: "friend request already exists" });
      }

      // create new friend request.
      const newFriendRequest = new FriendRequests({
        sender_id: userId,
        receiver_id: receiverId,
      });

      await newFriendRequest.save();

      return res.status(200).json({
        message: `friend request sent to ${receiver.firstName} ${receiver.lastName}`,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// friend request action (accept/decline)
friendRequestsRouter.post(
  "/friendRequests/:friendRequestId",
  verifyJWT,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const userId = req.userId;
      const friendRequestId = req.params.friendRequestId;
      const { action }: { action: "accept" | "decline" } = req.body;

      if (action !== "accept" && action !== "decline") {
        return res.status(400).json({ message: "invalid action" });
      }

      const friendRequest = await FriendRequests.findOne({
        _id: friendRequestId,
      });

      if (!friendRequest) {
        return res.status(400).json({ message: "friend request not found" });
      }

      const { sender_id, receiver_id } = friendRequest;

      if (action === "accept" && userId === sender_id.toString()) {
        return res.status(400).json({
          message: "you cannot accept the friend request you yourself has sent",
        });
      }

      if (action === "decline") {
        await FriendRequests.deleteOne({ _id: friendRequestId });
        return res.status(200).json({ message: "friend request declined" });
      }

      // add the new friends into friends array.
      // 01. add the sender into our friends array.
      await Friends.updateOne(
        { user_id: userId },
        { $push: { friends: sender_id } }
      );

      // 02. add us to the sender's friends array.
      await Friends.updateOne(
        { user_id: sender_id },
        { $push: { friends: userId } }
      );

      // delete the friend request if it's accepted.
      await FriendRequests.deleteOne({
        _id: friendRequest._id,
      });

      return res.status(200).json({ message: "friend request accepted" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default friendRequestsRouter;
