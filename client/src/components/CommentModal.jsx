import React, { useState, useEffect } from "react";
import { SendHorizonal, X, Trash2 } from "lucide-react";
import api from "../api/axios";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import moment from "moment";

const CommentModal = ({
  isOpen,
  onClose,
  postId,
  onCommentAdded,
  onCommentDeleted,
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const user = useSelector((state) => state.user.value);
  const { getToken } = useAuth();

  // Fetch comments when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchComments = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get(`/api/comments/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setComments(data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load comments.");
      }
    };

    fetchComments();
  }, [isOpen, postId, getToken]);

  // Add new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/comments",
        { post: postId, user: user, text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Prepend new comment to show first
      setComments((prev) => [data, ...prev]);
      setNewComment("");

      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment.");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      const token = await getToken();
      await api.delete(`/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");

      if (onCommentDeleted) onCommentDeleted(); // <-- notify parent
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete comment.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md h-[500px] flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Comments</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length > 0 ? (
            comments.map((c) => (
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src={
                      c.user?.profile_picture ||
                      "https://i.pravatar.cc/40?img=5"
                    }
                    alt={c.user?.full_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-[80%]">
                    <p className="text-sm font-medium">{c.user?.full_name}</p>
                    <p className="text-sm text-gray-700">{c.text}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {moment(c.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
                {c.user?._id === user?._id && (
                  <button
                    onClick={() => handleDeleteComment(c._id)}
                    className="p-1 hover:bg-red-100 rounded-full text-red-500"
                    title="Delete comment"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No comments yet.</p>
          )}
        </div>

        {/* Input Section */}
        <div className="p-3 border-t flex items-center gap-2">
          <img
            src={user?.profile_picture || "https://i.pravatar.cc/40?img=5"}
            alt="you"
            className="w-8 h-8 rounded-full object-cover"
          />
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddComment();
              }
            }}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
          />
          <button
            onClick={handleAddComment}
            className="bg-cyan-500 hover:bg-cyan-600 active:scale-95 cursor-pointer text-white p-2 rounded-full text-sm"
          >
            <SendHorizonal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
