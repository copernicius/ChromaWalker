import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBookmark extends Document {
  userId: Types.ObjectId;
  photoId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    photoId: { type: Schema.Types.ObjectId, ref: 'Photo', required: true },
  },
  { timestamps: true },
);

// One bookmark per (user, photo). The unique index makes "save" idempotent —
// a duplicate insert throws E11000, which the controller treats as a no-op.
bookmarkSchema.index({ userId: 1, photoId: 1 }, { unique: true });

export default mongoose.model<IBookmark>('Bookmark', bookmarkSchema);
