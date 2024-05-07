import mongoose, { Schema } from "mongoose";

interface IMessages {
  content: String;
  timestamp: Date;
  sender_id: Schema.Types.ObjectId;
  chat_id: Schema.Types.ObjectId;
  deleted_by: Schema.Types.ObjectId[];
}

const messagesSchema = new Schema<IMessages>({
  content: String,
  timestamp: Date,
  sender_id: { type: Schema.Types.ObjectId, ref: "User" },
  chat_id: { type: Schema.Types.ObjectId, ref: "Chat" },
  deleted_by: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

const Messages = mongoose.model("Messages", messagesSchema);

export default Messages;
