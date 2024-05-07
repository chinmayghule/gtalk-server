import express from "express";
import verifyJWT from "../middlewares/verifyJWT";
import Friends from "../schema/Friends";
import User from "../schema/User";

interface CustomRequest extends express.Request {
  userId?: string;
}

const friendsRouter = express.Router();

// get all friends of user.
friendsRouter.get(
  "/friends",
  verifyJWT,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const userId = req.userId;

      const friends = await Friends.findOne({ user_id: userId });

      if (!friends) {
        // check if userId exists in User.
        const user = await User.findOne({ _id: userId });

        if (!user) {
          // remove cookie by setting it to an empty string
          res.cookie("token", "", { maxAge: 0 });
          return res.status(400).json({ message: "user not found" });
        }

        return res
          .status(400)
          .json({ message: "user exists but record of friends not found" });
      }

      const friendsArray = friends.friends;

      // we'll be sending back an array of friends
      const responseArray = [];

      // get the details of all friends:
      // friendId, firstName, lastName, profileImageUrl, email
      const users = await User.find({ _id: { $in: friendsArray } }).select({
        _id: 1,
        firstName: 1,
        lastName: 1,
        profileImageUrl: 1,
        email: 1,
      });

      for (const user of users) {
        const { _id, firstName, lastName, profileImageUrl, email } = user;
        responseArray.push({
          friendId: _id.toString(),
          firstName,
          lastName,
          profileImageUrl,
          email,
        });
      }

      res.status(200).json({ friends: responseArray });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// search for friends by name, email or id.
friendsRouter.get(
  "/friends/search",
  verifyJWT,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const userId = req.userId;
      const query = req.query.q as string;

      // get our document from Friends collection.
      const userWithFriends = await Friends.findOne({ user_id: userId });

      if (!userWithFriends) {
        return res.status(400).json({ message: "user not found" });
      }

      const friendsArray = userWithFriends?.friends;

      // search for friends by name, email or id in User
      const users = await User.find({
        $or: [
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
          { _id: { $in: friendsArray } },
        ],
      });

      if (!users) {
        return res.status(200).json({ friends: [] });
      }

      // we'll be sending back an array of friends
      // get the details of all friends:
      // friendId, firstName, lastName, profileImageUrl, email
      const responseArray = [];

      for (const user of users) {
        const { _id, firstName, lastName, profileImageUrl, email } = user;
        responseArray.push({
          friendId: _id.toString(),
          firstName,
          lastName,
          profileImageUrl,
          email,
        });
      }

      res.status(200).json({ userId, friends: responseArray });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// remove a friend
friendsRouter.delete(
  "/friends/:friendId",
  verifyJWT,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const userId = req.userId;

      // get user's document from friends collection
      const user = await Friends.findOne({
        user_id: userId,
      });

      console.log("user: ", user);

      if (!user) {
        return res.status(400).json({ message: "user not found" });
      }

      // check if friend exists in friends array
      const friendToDelete = user.friends.find(
        (friend) => friend.toString() === req.params.friendId
      );

      if (!friendToDelete) {
        return res.status(400).json({ message: "friend not found" });
      }

      // get friend's document from friends collection
      const friend = await Friends.findOne({
        user_id: req.params.friendId,
      });

      if (!friend) {
        return res.status(400).json({ message: "friend not found" });
      }

      // check if user exists in friend's friends array
      const userInFriend = friend.friends.find(
        (friend) => friend.toString() === userId
      );

      if (!userInFriend) {
        return res
          .status(400)
          .json({ message: "user not found in friend's friends array" });
      }

      // delete the friend in the users' friends array.
      user.friends = user.friends.filter(
        (friend) => friend.toString() !== req.params.friendId
      );

      // delete the user in the friend's friends array.
      friend.friends = friend.friends.filter(
        (friend) => friend.toString() !== userId
      );

      await user.save();
      await friend.save();

      return res.status(200).json({ message: "friend removed" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default friendsRouter;
