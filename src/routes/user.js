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
const User_1 = __importDefault(require("../schema/User"));
const verifyJWT_1 = __importDefault(require("../middlewares/verifyJWT"));
const mongoose_1 = __importDefault(require("mongoose"));
const Friends_1 = __importDefault(require("../schema/Friends"));
const FriendRequests_1 = __importDefault(require("../schema/FriendRequests"));
const userRouter = express_1.default.Router();
// search user by username (firstName + lastName), email or id
userRouter.get("/search", verifyJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const searchQuery = req.query.q;
        if (!searchQuery) {
            return res
                .status(400)
                .json({ message: "Please provide a search query" });
        }
        const usersByNameOrEmail = yield User_1.default.find({
            $or: [
                { firstName: { $regex: new RegExp(searchQuery, "i") } },
                { lastName: { $regex: new RegExp(searchQuery, "i") } },
                { email: { $regex: new RegExp(searchQuery, "i") } },
            ],
        }, "-password");
        let users = [];
        if (searchQuery.length === 24) {
            let usersById = yield User_1.default.findById({ _id: new mongoose_1.default.Types.ObjectId(searchQuery) }, "-password");
            if (usersById) {
                users = usersByNameOrEmail.concat([usersById]);
            }
        }
        else {
            users = usersByNameOrEmail;
        }
        if (users.length === 0) {
            return res.status(200).json({ users: [] });
        }
        // remove users that are already friends
        // after that remove users that are already in a friend request
        // 01. get user frome friends.
        const userWithFriends = yield Friends_1.default.findOne({
            user_id: userId,
        });
        //02. remove the users that are already friends
        if (userWithFriends) {
            users = users.filter((user) => !userWithFriends.friends.includes(user._id));
        }
        // 03. get the list of users who we sent friend requests to and remove them from the list of users
        const usersWeSentFriendRequestsTo = yield FriendRequests_1.default.find({
            sender_id: userId,
        });
        if (usersWeSentFriendRequestsTo) {
            users = users.filter((user) => !usersWeSentFriendRequestsTo
                .map((request) => request.receiver_id.toString())
                .includes(user._id.toString()));
        }
        // get the list of users who sent us friend requests and remove them from the list of users.
        const usersWeReceivedFriendRequestsFrom = yield FriendRequests_1.default.find({
            receiver_id: userId,
        });
        if (usersWeReceivedFriendRequestsFrom) {
            users = users.filter((user) => !usersWeReceivedFriendRequestsFrom
                .map((request) => request.sender_id.toString())
                .includes(user._id.toString()));
        }
        // finally, remove ourselves from the list of users
        users = users.filter((user) => user._id.toString() !== userId);
        res.status(200).json({ users });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
exports.default = userRouter;
