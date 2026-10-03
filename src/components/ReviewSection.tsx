import React, { useState, useEffect } from 'react';
import { GameReview } from '../types/game';
import { StorageService } from '../services/storageService';
import { playSound } from '../utils/audio';
import { Star, MessageSquare, ThumbsUp, Send } from 'lucide-react';

interface ReviewSectionProps {
  gameId: string;
  gameTitle: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  gameId,
  gameTitle,
}) => {
  const [reviews, setReviews] = useState<GameReview[]>(() =>
    StorageService.getGameReviews(gameId)
  );
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [likedReviews, setLikedReviews] = useState<string[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      setReviews(StorageService.getGameReviews(gameId));
    };
    window.addEventListener('reviews-updated', handleUpdate);
    return () => window.removeEventListener('reviews-updated', handleUpdate);
  }, [gameId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    playSound('point');
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
    const newRev: GameReview = {
      id: `rev-${Date.now()}`,
      gameId,
      author: author.trim() || 'GuestPlayer',
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      rating,
      comment: comment.trim(),
      date: 'Just now',
      likes: 1,
    };

    StorageService.addGameReview(newRev);
    setAuthor('');
    setComment('');
  };

  const handleLike = (revId: string) => {
    if (likedReviews.includes(revId)) return;
    playSound('click');
    setLikedReviews([...likedReviews, revId]);
    setReviews(prev =>
      prev.map(r => (r.id === revId ? { ...r, likes: r.likes + 1 } : r))
    );
  };

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white font-heading">
            Community Reviews & Comments ({reviews.length})
          </h3>
        </div>
        <span className="text-xs text-neutral-400 font-medium">Player Verified</span>
      </div>

      {/* Review Submission Box */}
      <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Your Screen Name..."
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500 max-w-xs"
          />

          {/* Star selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-400">Rating:</span>
            {[1, 2, 3, 4, 5].map(s => (
              <button
                type="button"
                key={s}
                onClick={() => setRating(s)}
                className="p-0.5 hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-4 h-4 ${
                    s <= rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={2}
          required
          placeholder={`Share your tips, strategies, or impressions of ${gameTitle}...`}
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Review</span>
          </button>
        </div>
      </form>

      {/* Reviews List */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {reviews.map(rev => (
          <div
            key={rev.id}
            className="p-3.5 rounded-xl bg-neutral-950/40 border border-neutral-800/80 space-y-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                  style={{ backgroundColor: rev.avatarColor }}
                >
                  {rev.author.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-neutral-200">{rev.author}</span>
                <span className="text-neutral-500 text-[10px]">{rev.date}</span>
              </div>

              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: rev.rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                ))}
              </div>
            </div>

            <p className="text-neutral-300 leading-relaxed font-sans">{rev.comment}</p>

            <div className="flex items-center justify-end">
              <button
                onClick={() => handleLike(rev.id)}
                className={`flex items-center gap-1 text-[11px] transition-colors ${
                  likedReviews.includes(rev.id)
                    ? 'text-indigo-400 font-bold'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                <span>{rev.likes}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
