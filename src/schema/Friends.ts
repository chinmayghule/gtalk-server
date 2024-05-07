import mongoose, { Schema } from "mongoose";

interface IFriends {
  user_id: Schema.Types.ObjectId;
  friends: Schema.Types.ObjectId[];
}

const friendsSchema = new Schema<IFriends>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  friends: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const Friends = mongoose.model("Friends", friendsSchema);

export default Friends;
