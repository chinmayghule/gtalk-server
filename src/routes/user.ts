import express from "express";
import User from "../schema/User";
import verifyJWT from "../middlewares/verifyJWT";
import mongoose from "mongoose";
import Friends from "../schema/Friends";
import FriendRequests from "../schema/FriendRequests";

interface CustomRequest extends express.Request {
  userId?: string;
}

const userRouter = express.Router();

// search user by username (firstName + lastName), email or id
userRouter.get(
  "/search",
  verifyJWT,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const userId = req.userId;
      const searchQuery = req.query.q;

      if (!searchQuery) {
        return res
          .status(400)
          .json({ message: "Please provide a search query" });
      }

      const usersByNameOrEmail = await User.find(
        {
          $or: [
            { firstName: { $regex: new RegExp(searchQuery as string, "i") } },
            { lastName: { $regex: new RegExp(searchQuery as string, "i") } },
            { email: { $regex: new RegExp(searchQuery as string, "i") } },
          ],
        },
        "-password"
      );

      let users: any = [];

      if (searchQuery.length === 24) {
        let usersById = await User.findById(
          { _id: new mongoose.Types.ObjectId(searchQuery as string) },
          "-password"
        );

        if (usersById) {
          users = usersByNameOrEmail.concat([usersById]);
        }
      } else {
        users = usersByNameOrEmail;
      }

      if (users.length === 0) {
        return res.status(200).json({ users: [] });
      }

      // remove users that are already friends
      // after that remove users that are already in a friend request
      // 01. get user frome friends.
      const userWithFriends = await Friends.findOne({
        user_id: userId,
      });

      //02. remove the users that are already friends
      if (userWithFriends) {
        users = users.filter(
          (user: any) => !userWithFriends.friends.includes(user._id)
        );
      }

      // 03. get the list of users who we sent friend requests to and remove them from the list of users
      const usersWeSentFriendRequestsTo = await FriendRequests.find({
        sender_id: userId,
      });

      if (usersWeSentFriendRequestsTo) {
        users = users.filter(
          (user: any) =>
            !usersWeSentFriendRequestsTo
              .map((request: any) => request.receiver_id.toString())
              .includes(user._id.toString())
        );
      }

      // get the list of users who sent us friend requests and remove them from the list of users.
      const usersWeReceivedFriendRequestsFrom = await FriendRequests.find({
        receiver_id: userId,
      });

      if (usersWeReceivedFriendRequestsFrom) {
        users = users.filter(
          (user: any) =>
            !usersWeReceivedFriendRequestsFrom
              .map((request: any) => request.sender_id.toString())
              .includes(user._id.toString())
        );
      }

      // finally, remove ourselves from the list of users
      users = users.filter((user: any) => user._id.toString() !== userId);

      res.status(200).json({ users });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default userRouter;
