import React, { useState } from "react";
import {
  BadgeCheck,
  Heart,
  MessageCircle,
  MoreVertical,
  Bookmark,
} from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import CommentModal from "./CommentModal";

const PostCard = ({ post, onDelete, onToggleSaved, onClickHashtag }) => {
  const [likes, setLikes] = useState(post.likes_count);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
  const [saved, setSaved] = useState(post.savedByCurrentUser || false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  const { getToken } = useAuth();
  const currentUser = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  const user = post.user;

  const renderContentWithHashtags = (text) => {
    const parts = text.split(/(\#[a-zA-Z0-9_]+)/g); // split hashtags
    return parts.map((part, idx) => {
      if (part.startsWith("#")) {
        return (
          <span
            key={idx}
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => onClickHashtag && onClickHashtag(part)}
          >
            {part}
          </span>
        );
      }
      return (
        <span key={idx} key={idx}>
          {part}
        </span>
      );
    });
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/saved/toggle/${post._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setSaved(data.saved);
        toast.success(data.message);
        if (onToggleSaved) onToggleSaved(post._id, data.saved);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLike = async () => {
    try {
      const { data } = await api.post(
        `/api/post/like`,
        { postId: post._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setLikes((prev) =>
          prev.includes(currentUser._id)
            ? prev.filter((id) => id !== currentUser._id)
            : [...prev, currentUser._id]
        );
        toast.success(data.message);
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const { data } = await api.delete(`/api/post/${post._id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success && onDelete) onDelete(post._id);
      toast.success(data.message);
      setConfirmDeleteModal(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const postWithHashtags = post.content?.replace(
    /(#\w+)/g,
    '<span class="text-indigo-600">$1</span>'
  );

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl relative">
      {/* User Info */}
      <div className="flex justify-between items-start">
        <div
          onClick={() => user._id && navigate("/profile/" + user._id)}
          className="inline-flex items-center gap-3 cursor-pointer"
        >
          <img
            src={user.profile_picture}
            alt=""
            className="w-10 h-10 rounded-full shadow object-center"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span>{user.full_name}</span>
              {user._id && <BadgeCheck className="w-4 h-4 text-blue-500" />}
            </div>
            <div className="text-gray-500 text-sm">
              @{user.username} . {moment(post.createdAt).fromNow()}
            </div>
          </div>
        </div>

        {/* Menu */}
        {currentUser._id === user._id && (
          <div className="relative">
            <MoreVertical
              className="w-5 h-5 cursor-pointer text-gray-500"
              onClick={() => setMenuOpen((prev) => !prev)}
            />
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                {/* Delete button always visible */}
                <button
                  onClick={() => setConfirmDeleteModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 font-medium rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors duration-150 w-full"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="text-gray-800 text-sm whitespace-pre-line">
          {renderContentWithHashtags(post.content)}
        </div>
      )}

      {/* Images */}
      <div className="grid grid-cols-2 gap-2">
        {post.image_urls?.map((img, index) => (
          <img
            src={img}
            key={index}
            className={`w-full h-48 object-cover rounded-lg ${
              post.image_urls.length === 1 && "col-span-2 h-auto"
            }`}
            alt=""
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-300">
        <div className="flex items-center gap-1">
          <Heart
            className={`w-4 h-4 cursor-pointer ${
              likes.includes(currentUser._id) && "text-red-500 fill-red-500"
            }`}
            onClick={handleLike}
          />
          <span>{likes.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle
            className=" w-4 h-4 cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          />
          <span>{commentCount}</span>
        </div>

        {/* Save Button */}
        <button onClick={handleSave} className="px-2 py-1 rounded">
          <Bookmark
            className={`w-4 h-4 cursor-pointer transition-colors ${
              saved ? "text-orange-500" : ""
            }`}
          />
        </button>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postId={post._id}
        onCommentAdded={() => setCommentCount((prev) => prev + 1)}
        onCommentDeleted={() => setCommentCount((prev) => prev - 1)}
      />

      {/* Confirm Delete Modal */}
      {confirmDeleteModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50  z-90"
            onClick={() => setConfirmDeleteModal(false)}
          />

          {/* Centered Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-100">
            <div className="bg-white rounded-xl shadow-lg p-6 w-80">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Are you sure you want to delete this post?
              </h3>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => {
                    setConfirmDeleteModal(false); // close modal
                    setMenuOpen(false); // also close menu
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PostCard;
