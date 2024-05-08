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
exports.generateToken = exports.compareHash = exports.hashString = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const saltRounds = 10;
function hashString(str) {
    return __awaiter(this, void 0, void 0, function* () {
        const hashedString = yield bcryptjs_1.default.hash(str, saltRounds);
        return hashedString;
    });
}
exports.hashString = hashString;
function compareHash(str, hashedString) {
    return __awaiter(this, void 0, void 0, function* () {
        return bcryptjs_1.default.compare(str, hashedString);
    });
}
exports.compareHash = compareHash;
function generateToken(_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = jsonwebtoken_1.default.sign({
            userId: _id,
        }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        return token;
    });
}
exports.generateToken = generateToken;
