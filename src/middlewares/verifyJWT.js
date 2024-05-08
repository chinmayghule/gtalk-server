"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function verifyJWT(req, res, next) {
    // Check if req.cookies is defined
    if (!req.cookies) {
        return res.status(401).json({ message: "Unauthorized: No cookies sent" });
    }
    // extract token from cookie
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token" });
    }
    try {
        // verify token using secret key
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = decodedToken.userId;
        next();
    }
    catch (error) {
        res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}
exports.default = verifyJWT;
