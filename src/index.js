"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
// import routes
const auth_1 = __importDefault(require("./routes/auth"));
const friends_1 = __importDefault(require("./routes/friends"));
const chat_1 = __importDefault(require("./routes/chat"));
const friendRequests_1 = __importDefault(require("./routes/friendRequests"));
const user_1 = __importDefault(require("./routes/user"));
const app = (0, express_1.default)();
dotenv.config();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Allow requests from localhost:3000 (modify as needed)
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "https://localhost:3000"],
    credentials: true,
}));
mongoose_1.default.connect(process.env.MONGO_URI);
const db = mongoose_1.default.connection;
db.on("error", (error) => console.error(error));
db.on("open", () => console.log("Connected to MongoDB"));
// use routes.
app.use(auth_1.default);
app.use(user_1.default);
app.use(friends_1.default);
app.use(friendRequests_1.default);
app.use(chat_1.default);
// listen on port PORT and console log message.
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
