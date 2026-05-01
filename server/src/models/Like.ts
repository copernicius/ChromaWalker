import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILike extends Document {
  userId: Types.ObjectId;
  photoId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    photoId: { type: Schema.Types.ObjectId, ref: 'Photo', required: true },
  },
  { timestamps: true },
);

// One like per (user, photo). The unique index is what makes "like" idempotent
// — a duplicate insert throws E11000 which the controller treats as a no-op.
likeSchema.index({ userId: 1, photoId: 1 }, { unique: true });

export default mongoose.model<ILike>('Like', likeSchema);
