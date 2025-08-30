import React, { useState } from "react";
import {
  BadgeCheck,
  Heart,
  MessageCircle,
  MoreVertical,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Edit2,
} from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import CommentModal from "./CommentModal";
import EditPostModal from "./EditPostModal";

const PostCard = ({ post, onDelete, onToggleSaved, onClickHashtag }) => {
  const [postData, setPostData] = useState(post); // <- Local state for re-render
  const [likes, setLikes] = useState(post.likes_count);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
  const [saved, setSaved] = useState(post.savedByCurrentUser || false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
const MAX_LENGTH = 150;

  const { getToken } = useAuth();
  const currentUser = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  const user = postData.user;

  // Render content with clickable links and hashtags
  const renderContent = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, idx) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {part}
          </a>
        );
      } else {
        const subParts = part.split(/(\#[a-zA-Z0-9_]+)/g);
        return subParts.map((sub, subIdx) =>
          sub.startsWith("#") ? (
            <span
              key={subIdx}
              className="text-blue-500 cursor-pointer hover:underline"
              onClick={() => onClickHashtag && onClickHashtag(sub)}
            >
              {sub}
            </span>
          ) : (
            <span key={subIdx}>{sub}</span>
          )
        );
      }
    });
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/saved/toggle/${postData._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setSaved(data.saved);
        toast.success(data.message);
        if (onToggleSaved) onToggleSaved(postData._id, data.saved);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleLike = async () => {
    try {
      const { data } = await api.post(
        `/api/post/like`,
        { postId: postData._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setLikes((prev) =>
          prev.includes(currentUser._id)
            ? prev.filter((id) => id !== currentUser._id)
            : [...prev, currentUser._id]
        );
        toast.success(data.message);
      } else console.error(data.message);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const { data } = await api.delete(`/api/post/${postData._id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success && onDelete) onDelete(postData._id);
      toast.success(data.message);
      setConfirmDeleteModal(false);
    } catch (error) {
      console.error(error.message);
    }
  };

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
              @{user.username} . {moment(postData.createdAt).fromNow()}
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
  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-20 animate-fade-in">
    
    {/* Delete Button */}
    <button
      onClick={() => setConfirmDeleteModal(true)}
      className="flex items-center gap-2 px-4 py-3 text-red-600 font-semibold rounded-t-lg hover:bg-red-100 transition-colors duration-200 w-full"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
    
    {/* Divider */}
    <div className="border-t border-gray-100"></div>

    {/* Edit Button */}
    <button
      onClick={() => setIsEditModalOpen(true)}
      className="flex items-center gap-2 px-4 py-3 text-gray-800 font-semibold hover:bg-gray-200 transition-colors duration-200 w-full rounded-b-lg"
    >
      <Edit2 className="w-4 h-4" />
      Edit
    </button>

  </div>
)}

          </div>
        )}
      </div>

      {/* Content */}
      {postData.content && (
  <div className="text-gray-800 text-sm whitespace-pre-line">
    {showFullContent
      ? renderContent(postData.content)
      : renderContent(postData.content.slice(0, MAX_LENGTH))}

    {/* Toggle button only if content is long */}
    {postData.content.length > MAX_LENGTH && (
      <button
        className="ml-1 text-cyan-700 font-medium hover:underline"
        onClick={() => setShowFullContent((prev) => !prev)}
      >
        {showFullContent ? "See less" : "... See more"}
      </button>
    )}
  </div>
)}


      {/* Images */}
      <div className="grid grid-cols-2 gap-2">
        {postData.image_urls?.map((img, index) => (
          <img
            src={img}
            key={index}
            className={`w-full h-48 object-cover rounded-lg ${
              postData.image_urls.length === 1 && "col-span-2 h-auto"
            } cursor-pointer`}
            alt=""
            onClick={() => setPreviewIndex(index)}
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
              saved ? "text-cyan-500" : ""
            }`}
          />
        </button>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postId={postData._id}
        onCommentAdded={() => setCommentCount((prev) => prev + 1)}
        onCommentDeleted={() => setCommentCount((prev) => prev - 1)}
      />

      {/* Confirm Delete Modal */}
      {confirmDeleteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50  z-90"
            onClick={() => setConfirmDeleteModal(false)}
          />
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
                    setConfirmDeleteModal(false);
                    setMenuOpen(false);
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

      {/* Image Preview Modal */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            className="absolute top-4 right-4 bg-white/30 hover:bg-white/60 text-white rounded-full p-2 shadow-lg transition"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex(null);
            }}
          >
            <X className="w-6 h-6 text-black" />
          </button>

          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/60 text-white rounded-full p-3 shadow-lg transition"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex((prev) =>
                prev > 0 ? prev - 1 : postData.image_urls.length - 1
              );
            }}
          >
            <ChevronLeft className="w-6 h-6 text-black" />
          </button>

          <img
            src={postData.image_urls[previewIndex]}
            alt=""
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/60 text-white rounded-full p-3 shadow-lg transition"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex((prev) =>
                prev < postData.image_urls.length - 1 ? prev + 1 : 0
              );
            }}
          >
            <ChevronRight className="w-6 h-6 text-black" />
          </button>
        </div>
      )}

      {/* Edit Post Modal */}
      <EditPostModal
        post={postData}
        isOpen={isEditModalOpen}
        setMenuOpen={setMenuOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={(updatedPost) => {
          setPostData(updatedPost); // <- updates feed immediately
          toast.success("Post updated!");
        }}
      />
    </div>
  );
};

export default PostCard;
