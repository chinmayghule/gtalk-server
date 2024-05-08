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
const FriendRequests_1 = __importDefault(require("../schema/FriendRequests"));
const User_1 = __importDefault(require("../schema/User"));
const friendRequestsRouter = express_1.default.Router();
// get all friend requests.
friendRequestsRouter.get("/friendRequests", verifyJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // this is what we'll be sending back.
    const responseFriendRequests = [];
    try {
        const userId = req.userId;
        // get all friend requests where userId === receiverId or userId === senderId
        const friendRequests = yield FriendRequests_1.default.find({
            $or: [{ sender_id: userId }, { receiver_id: userId }],
        });
        if (!friendRequests) {
            return res.status(400).json({ message: "no friend requests found" });
        }
        for (const friendRequest of friendRequests) {
            const { _id, sender_id, receiver_id } = friendRequest;
            // check which id is not the userId
            const otherUserId = sender_id.toString() === userId ? receiver_id : sender_id;
            // get the other user.
            const otherUser = yield User_1.default.findOne({ _id: otherUserId });
            const responseFriendRequest = {
                friendRequestId: _id.toString(),
                potentialFriendId: sender_id.toString(),
                friendFirstName: (otherUser === null || otherUser === void 0 ? void 0 : otherUser.firstName) || "",
                friendLastName: (otherUser === null || otherUser === void 0 ? void 0 : otherUser.lastName) || "",
                friendProfileImageUrl: (otherUser === null || otherUser === void 0 ? void 0 : otherUser.profileImageUrl) || undefined,
                friendEmail: (otherUser === null || otherUser === void 0 ? void 0 : otherUser.email) || "",
            };
            responseFriendRequests.push(responseFriendRequest);
        }
        return res.status(200).json({ userId, responseFriendRequests });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// send friend request
friendRequestsRouter.post("/friendRequests", verifyJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const receiver = yield User_1.default.findOne({ _id: receiverId });
        if (!receiver) {
            return res.status(400).json({ message: "receiver not found" });
        }
        // check if the receiver is already a friend
        const userWithFriends = yield Friends_1.default.findOne({
            user_id: userId,
        });
        const doesFriendAlreadyExist = userWithFriends === null || userWithFriends === void 0 ? void 0 : userWithFriends.friends.includes(receiverId);
        if (doesFriendAlreadyExist) {
            return res.status(400).json({ message: "friend already exists" });
        }
        // check if a friend request already exists.
        const friendRequest = yield FriendRequests_1.default.findOne({
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
        const newFriendRequest = new FriendRequests_1.default({
            sender_id: userId,
            receiver_id: receiverId,
        });
        yield newFriendRequest.save();
        return res.status(200).json({
            message: `friend request sent to ${receiver.firstName} ${receiver.lastName}`,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// friend request action (accept/decline)
friendRequestsRouter.post("/friendRequests/:friendRequestId", verifyJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const friendRequestId = req.params.friendRequestId;
        const { action } = req.body;
        if (action !== "accept" && action !== "decline") {
            return res.status(400).json({ message: "invalid action" });
        }
        const friendRequest = yield FriendRequests_1.default.findOne({
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
            yield FriendRequests_1.default.deleteOne({ _id: friendRequestId });
            return res.status(200).json({ message: "friend request declined" });
        }
        // add the new friends into friends array.
        // 01. add the sender into our friends array.
        yield Friends_1.default.updateOne({ user_id: userId }, { $push: { friends: sender_id } });
        // 02. add us to the sender's friends array.
        yield Friends_1.default.updateOne({ user_id: sender_id }, { $push: { friends: userId } });
        // delete the friend request if it's accepted.
        yield FriendRequests_1.default.deleteOne({
            _id: friendRequest._id,
        });
        return res.status(200).json({ message: "friend request accepted" });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
exports.default = friendRequestsRouter;
