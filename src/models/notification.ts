import { ObjectId, Schema, model } from "mongoose";

export interface INotification {
  _id: ObjectId;
  recipient_id: ObjectId;
  sender_id?: ObjectId;
  related_id?: ObjectId;
  type: string;
  message: string;
  read: boolean;
  created_at: Date;
}

const notificationSchema = new Schema<INotification>({
  recipient_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sender_id: { type: Schema.Types.ObjectId, ref: "User" },
  related_id: { type: Schema.Types.ObjectId },
  type: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export const NotificationModel = model<INotification>(
  "Notification",
  notificationSchema
);
