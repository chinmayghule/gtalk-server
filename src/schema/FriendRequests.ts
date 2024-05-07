import mongoose, { Schema } from "mongoose";

interface IFriendRequests {
  sender_id: Schema.Types.ObjectId;
  receiver_id: Schema.Types.ObjectId;
}

const FriendRequestsSchema = new Schema<IFriendRequests>({
  sender_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const FriendRequests = mongoose.model("FriendRequests", FriendRequestsSchema);

export default FriendRequests;
