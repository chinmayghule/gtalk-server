"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyJWT_1 = __importDefault(require("../middlewares/verifyJWT"));
const Friends_1 = __importDefault(require("../schema/Friends"));
const User_1 = __importDefault(require("../schema/User"));
const friendsRouter = express_1.default.Router();
// get all friends of user.
friendsRouter.get("/friends", verifyJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const friends = yield Friends_1.default.findOne({ user_id: userId });
        if (!friends) {
            // check if userId exists in User.
            const user = yield User_1.default.findOne({ _id: userId });
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
        const users = yield User_1.default.find({ _id: { $in: friendsArray } }).select({
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
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// search for friends by name, email or id.
friendsRouter.get("/friends/search", verifyJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const query = req.query.q;
        // get our document from Friends collection.
        const userWithFriends = yield Friends_1.default.findOne({ user_id: userId });
        if (!userWithFriends) {
            return res.status(400).json({ message: "user not found" });
        }
        const friendsArray = userWithFriends === null || userWithFriends === void 0 ? void 0 : userWithFriends.friends;
        // search for friends by name, email or id in User
        const users = yield User_1.default.find({
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
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// remove a friend
friendsRouter.delete("/friends/:friendId", verifyJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        // get user's document from friends collection
        const user = yield Friends_1.default.findOne({
            user_id: userId,
        });
        console.log("user: ", user);
        if (!user) {
            return res.status(400).json({ message: "user not found" });
        }
        // check if friend exists in friends array
        const friendToDelete = user.friends.find((friend) => friend.toString() === req.params.friendId);
        if (!friendToDelete) {
            return res.status(400).json({ message: "friend not found" });
        }
        // get friend's document from friends collection
        const friend = yield Friends_1.default.findOne({
            user_id: req.params.friendId,
        });
        if (!friend) {
            return res.status(400).json({ message: "friend not found" });
        }
        // check if user exists in friend's friends array
        const userInFriend = friend.friends.find((friend) => friend.toString() === userId);
        if (!userInFriend) {
            return res
                .status(400)
                .json({ message: "user not found in friend's friends array" });
        }
        // delete the friend in the users' friends array.
        user.friends = user.friends.filter((friend) => friend.toString() !== req.params.friendId);
        // delete the user in the friend's friends array.
        friend.friends = friend.friends.filter((friend) => friend.toString() !== userId);
        yield user.save();
        yield friend.save();
        return res.status(200).json({ message: "friend removed" });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
exports.default = friendsRouter;
