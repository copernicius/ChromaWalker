import { useMemo, useState } from 'react';
import { type Comment, useAddCommentMutation } from '../queries';
import { useAppStore } from '../store';
import { UserAvatar } from './UserAvatar';

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

  // Two-layer flattening: every descendant of a top-level comment (replies,
  // replies-to-replies, ...) collapses into a single indented block under
  // its root, regardless of how deep the actual chain goes. The @mention
  // prefix on each reply preserves the "who am I replying to" context that
  // a deeper indent would otherwise convey.
  const { byId, roots, repliesByRoot } = useMemo(() => {
    const byId = new Map<string, Comment>();
    for (const c of comments) byId.set(c.id, c);

    const findRootId = (c: Comment): string => {
      let cur = c;
      while (cur.parentId) {
        const parent = byId.get(cur.parentId);
        if (!parent) return cur.id; // orphan — promote to its own root
        cur = parent;
      }
      return cur.id;
    };

    const roots: Comment[] = [];
    const repliesByRoot = new Map<string, Comment[]>();
    for (const c of comments) {
      const rootId = findRootId(c);
      if (rootId === c.id) {
        roots.push(c);
        if (!repliesByRoot.has(c.id)) repliesByRoot.set(c.id, []);
      } else {
        const list = repliesByRoot.get(rootId) ?? [];
        list.push(c);
        repliesByRoot.set(rootId, list);
      }
    }
    return { byId, roots, repliesByRoot };
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

  const renderRow = (comment: Comment, variant: 'root' | 'reply') => {
    const isReplying = replyingTo === comment.id;
    const parent = comment.parentId ? byId.get(comment.parentId) : null;
    const avatarSize = variant === 'root' ? 32 : 24;
    const textSize = variant === 'root' ? 'text-sm' : 'text-xs';

    return (
      <div className="flex gap-3">
        <UserAvatar
          url={comment.avatarUrl}
          name={comment.username}
          size={avatarSize}
          gradientClass="from-[#4DB6AC] to-[#8BA888]"
        />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-[#2D2520] ${textSize}`}>
            {comment.username}
          </p>
          <p className={`${textSize} text-gray-700 leading-relaxed break-words`}>
            {parent && variant === 'reply' && (
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

        {roots.map((root) => {
          const replies = repliesByRoot.get(root.id) ?? [];
          return (
            <div key={root.id} className="animate-fade-in">
              {renderRow(root, 'root')}
              {replies.length > 0 && (
                <div className="ml-8 mt-3 space-y-3 border-l-2 border-gray-100 pl-3">
                  {replies.map((reply) => (
                    <div key={reply.id}>{renderRow(reply, 'reply')}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
