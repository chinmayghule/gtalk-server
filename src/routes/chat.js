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
const Chat_1 = __importDefault(require("../schema/Chat"));
const mongoose_1 = __importDefault(require("mongoose"));
const Messages_1 = __importDefault(require("../schema/Messages"));
const User_1 = __importDefault(require("../schema/User"));
const chatRouter = express_1.default.Router();
// get all pinned chats for the user.
chatRouter.get("/chat", verifyJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        // get all chats in Chat in which the participants array contains the userId
        let chats = yield Chat_1.default.find({
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
            const friendId = participants.find((id) => id.toString() !== userId);
            // get details of friend.
            const friend = yield User_1.default.findOne({ _id: friendId });
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
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// create a new conversation.
chatRouter.post("/chat/create", verifyJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.userId;
        const { participants } = req.body;
        if (participants.length < 2 || !participants.includes(userId)) {
            return res.status(400).json({ message: "invalid participants" });
        }
        // first check whether a conversation already exists
        // where participants array contains the users of the
        // given participants array
        const existingChat = yield Chat_1.default.findOne({
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
                participants: yield Promise.all(participants.map((participant) => __awaiter(void 0, void 0, void 0, function* () {
                    const user = yield User_1.default.findOne({ _id: participant });
                    return {
                        participantId: user === null || user === void 0 ? void 0 : user._id.toString(),
                        firstName: user === null || user === void 0 ? void 0 : user.firstName,
                        lastName: user === null || user === void 0 ? void 0 : user.lastName,
                        email: user === null || user === void 0 ? void 0 : user.email,
                        profileImageUrl: user === null || user === void 0 ? void 0 : user.profileImageUrl,
                    };
                }))),
            });
        }
        // create a new document in Chat
        let chat;
        try {
            chat = yield Chat_1.default.create({
                name: (_a = req.body) === null || _a === void 0 ? void 0 : _a.name,
                type: (_b = req.body) === null || _b === void 0 ? void 0 : _b.type,
                participants: [...req.body.participants],
            });
        }
        catch (error) {
            if (error instanceof mongoose_1.default.Error.ValidationError) {
                return res.status(400).json({ message: error.message });
            }
            else if (error instanceof mongoose_1.default.Error.CastError) {
                return res.status(400).json({ message: error.message });
            }
            else if (error instanceof mongoose_1.default.Error.VersionError) {
                return res.status(400).json({ message: error.message });
            }
            else {
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
            participants: yield Promise.all(participants.map((participant) => __awaiter(void 0, void 0, void 0, function* () {
                const user = yield User_1.default.findOne({ _id: participant });
                return {
                    participantId: user === null || user === void 0 ? void 0 : user._id.toString(),
                    firstName: user === null || user === void 0 ? void 0 : user.firstName,
                    lastName: user === null || user === void 0 ? void 0 : user.lastName,
                    email: user === null || user === void 0 ? void 0 : user.email,
                    profileImageUrl: user === null || user === void 0 ? void 0 : user.profileImageUrl,
                };
            }))),
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// get a single chat for the user
chatRouter.get("/chat/:chatId", verifyJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        // check if chat with chatId exists in Chat
        const chat = yield Chat_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(chatId),
            participants: { $in: [userId] },
        });
        if (!chat) {
            return res.status(400).json({ message: "chat not found" });
        }
        // get all messages associated with the chat _id
        let messages = yield Messages_1.default.find({
            chat_id: new mongoose_1.default.Types.ObjectId(chatId),
        });
        if (!messages) {
            messages = [];
        }
        res.status(200).json({ messages });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// unpin and clear a chat: TODO
exports.default = chatRouter;
