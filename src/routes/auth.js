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
const helpers_1 = require("../helpers");
const verifyJWT_1 = __importDefault(require("../middlewares/verifyJWT"));
const mongoose_1 = __importDefault(require("mongoose"));
const Friends_1 = __importDefault(require("../schema/Friends"));
const authRouter = express_1.default.Router();
//signup
authRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // get email and password from body
    const { firstName, lastName, email, password } = req.body;
    console.log(firstName, lastName, email, password);
    try {
        // Check for existing email
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }
        // email does not exist in db so we can safely proceed
        const hashedPassword = yield (0, helpers_1.hashString)(password);
        const newUser = new User_1.default({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });
        // created new user in database
        yield newUser.save();
        console.log("User created: ", newUser);
        // create a new document in friends collection
        const newFriend = new Friends_1.default({
            user_id: newUser._id,
            friends: [],
        });
        yield newFriend.save();
        // generate JWT with user id
        const token = yield (0, helpers_1.generateToken)(newUser._id.toString());
        // set cookie with httpOnly flag
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        // set regular object containing user info:
        // { firstName, lastName, email }
        const userInfo = {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
        };
        res.cookie("userInfo", JSON.stringify(userInfo), {
            httpOnly: false,
        });
        res.status(201).json({ message: "user created successfully" });
    }
    catch (error) {
        console.log("Could not create user", error);
        res.status(400).json({ message: "user could not be created" });
    }
}));
//login
authRouter.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // get email and password from body
    const { email, password } = req.body;
    console.log(email, password);
    const user = yield User_1.default.findOne({ email });
    if (!user) {
        return res
            .status(400)
            .json({ message: "user not found, email might be incorrect" });
    }
    const isPasswordValid = yield (0, helpers_1.compareHash)(password, user.password);
    if (isPasswordValid) {
        // generate JWT with user id
        const token = yield (0, helpers_1.generateToken)(user._id.toString());
        // set cookie with httpOnly flag
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        // set regular object containing user info:
        // { firstName, lastName, email }
        const userInfo = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        };
        res.cookie("userInfo", JSON.stringify(userInfo), {
            httpOnly: false,
        });
        return res.status(200).json({ message: "login sucessful" });
    }
    res.status(400).json({ message: "incorrect password" });
}));
// logout
authRouter.get("/logout", verifyJWT_1.default, (req, res) => {
    res.clearCookie("token");
    res.clearCookie("userInfo");
    res.status(200).json({ message: "logout successful" });
});
// get current user
authRouter.get("/user", verifyJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // get user id from token
        const userId = req.userId;
        // get user info from User except password
        const user = yield User_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(userId),
        }).select("-password");
        // if user not found, remove the token and send error
        if (!user) {
            res.clearCookie("token");
            return res.status(400).json({ message: "user not found" });
        }
        res.status(200).json({ user });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
exports.default = authRouter;
