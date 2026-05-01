import { useMemo, useState } from 'react';
import { type Comment, useAddCommentMutation } from '../queries';
import { useAppStore } from '../store';

interface Props {
  photoId: string;
  comments: Comment[];
  isLoading: boolean;
}

export function CommentThread({ photoId, comments, isLoading }: Props) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const addComment = useAddCommentMutation(photoId);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [topLevelText, setTopLevelText] = useState('');
  const [replyText, setReplyText] = useState('');

  // Lookup table for the @mention prefix on replies — server already sorts by
  // path so a parent always appears before its child in the array.
  const byId = useMemo(() => {
    const map = new Map<string, Comment>();
    for (const c of comments) map.set(c.id, c);
    return map;
  }, [comments]);

  const handleSubmitTopLevel = () => {
    const text = topLevelText.trim();
    if (!text || addComment.isPending) return;
    addComment.mutate(
      { text },
      { onSuccess: () => setTopLevelText('') },
    );
  };

  const handleSubmitReply = (parentId: string) => {
    const text = replyText.trim();
    if (!text || addComment.isPending) return;
    addComment.mutate(
      { text, parentId },
      {
        onSuccess: () => {
          setReplyText('');
          setReplyingTo(null);
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* Top-level composer — always visible above the scrollable list */}
      {isAuthenticated && (
        <div className="flex gap-2">
          <input
            type="text"
            value={topLevelText}
            onChange={(e) => setTopLevelText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmitTopLevel();
            }}
            placeholder="Add a comment..."
            disabled={addComment.isPending}
            className="flex-1 px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D2520]/20 transition-all text-sm disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSubmitTopLevel}
            disabled={addComment.isPending || !topLevelText.trim()}
            className="px-6 py-3 bg-[#2D2520] text-white rounded-2xl font-semibold hover:bg-[#3D3530] transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Post
          </button>
        </div>
      )}

      {/* Scrollable list */}
      <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
        {isLoading && (
          <p className="text-sm text-gray-500 text-center py-4">Loading comments…</p>
        )}

        {!isLoading && comments.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No comments yet. Be the first!
          </p>
        )}

        {comments.map((comment) => {
          const isReplying = replyingTo === comment.id;
          const parent = comment.parentId ? byId.get(comment.parentId) : null;

          return (
            <div key={comment.id} className="animate-fade-in">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#4DB6AC] to-[#8BA888] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {comment.avatarUrl ? (
                    <img
                      src={comment.avatarUrl}
                      alt={comment.username}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    comment.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#2D2520]">
                    {comment.username}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed break-words">
                    {parent && (
                      <span className="text-[#4DB6AC] font-medium mr-1">
                        @{parent.username}
                      </span>
                    )}
                    {comment.text}
                  </p>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                      className="text-xs text-gray-500 hover:text-[#2D2520] mt-1 transition-colors"
                    >
                      {isReplying ? 'Cancel' : 'Reply'}
                    </button>
                  )}

                  {isReplying && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSubmitReply(comment.id);
                          if (e.key === 'Escape') {
                            setReplyText('');
                            setReplyingTo(null);
                          }
                        }}
                        placeholder={`Reply to ${comment.username}...`}
                        autoFocus
                        disabled={addComment.isPending}
                        className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D2520]/20 text-sm disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={addComment.isPending || !replyText.trim()}
                        className="px-4 py-2 bg-[#2D2520] text-white rounded-xl font-semibold text-sm hover:bg-[#3D3530] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
