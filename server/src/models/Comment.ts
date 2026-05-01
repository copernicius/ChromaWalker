import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment extends Document {
  photoId: Types.ObjectId;
  userId: Types.ObjectId;
  username: string;
  avatarUrl: string;
  parentId: Types.ObjectId | null;
  // Materialized path: slash-joined ObjectId hex strings of all ancestors
  // INCLUDING this comment's own _id. Sorting by `path` ascending yields
  // depth-first traversal order, so the client can render the tree by simply
  // iterating the array and indenting by `depth`.
  path: string;
  depth: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    photoId: {
      type: Schema.Types.ObjectId,
      ref: 'Photo',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    path: { type: String, required: true },
    depth: { type: Number, required: true, default: 0 },
    text: { type: String, required: true, maxlength: 1000 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        if (ret.createdAt) {
          ret.timestamp = ret.createdAt;
          delete ret.createdAt;
        }
        delete ret.updatedAt;
      },
    },
  },
);

// (photoId, path) is the natural read pattern — fetch all comments for a
// photo, already in DFS order. createdAt as tiebreaker keeps stable order on
// the rare path collision (shouldn't happen since path includes self _id).
commentSchema.index({ photoId: 1, path: 1, createdAt: 1 });

export default mongoose.model<IComment>('Comment', commentSchema);
