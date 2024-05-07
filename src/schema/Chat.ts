import mongoose, { Schema } from "mongoose";

interface IChat {
  isActive: boolean;
  name: String | null;
  type: "private" | "group";
  participants: Schema.Types.ObjectId[];
  chatHistoryCutoff: { type: Map<Schema.Types.ObjectId, Date>; of: Date };
}

const chatSchema = new Schema<IChat>({
  isActive: Boolean,
  name: { type: String, default: null },
  type: { type: String, default: "private" },
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  chatHistoryCutoff: { type: Map, of: Date },
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
