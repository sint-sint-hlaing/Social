import React, { useState } from "react";
import {
  BadgeCheck,
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
} from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import CommentModal from "./CommentModal";

const PostCard = ({ post, onDelete }) => {
  const postWithHashtages = post.content?.replace(
    /(#\w+)/g,
    '<span class ="text-indigo-600">$1</span>'
  );

  const [likes, setLikes] = useState(post.likes_count);
  const [menuOpen, setMenuOpen] = useState(false); // For three-dot menu
  const currentUser = useSelector((state) => state.user.value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);

  const { getToken } = useAuth();
  const navigate = useNavigate();

  // Fallback for deleted user
  const user = post.user || {
    _id: null,
    full_name: "Deleted Account",
    username: "deleted",
    profile_picture: "/path/to/default-profile.png",
  };

  const handleLike = async () => {
    try {
      const { data } = await api.post(
        `/api/post/like`,
        { postId: post._id },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      if (data.success) {
        toast.success(data.message);
        setLikes((prev) =>
          prev.includes(currentUser._id)
            ? prev.filter((id) => id !== currentUser._id)
            : [...prev, currentUser._id]
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const { data } = await api.delete(`/api/post/${post._id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(data.message);

        // Notify parent to remove post
        if (onDelete) onDelete(post._id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
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
              @{user.username} . {moment(post.createdAt).fromNow()}
            </div>
          </div>
        </div>

        {/* Three-dot menu for delete */}
        {currentUser._id === user._id && (
          <div className="relative">
            <MoreVertical
              className="w-5 h-5 cursor-pointer text-gray-500"
              onClick={() => setMenuOpen((prev) => !prev)}
            />
            {menuOpen && (
              <div className="absolute right-0 bg-gray-100  rounded shadow-md z-10">
                <button
                  onClick={handleDelete}
                  className=" cursor-pointer flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-gray-100 w-full"
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
        <div
          className="text-gray-800 text-sm whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: postWithHashtages }}
        />
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
        <div className="flex items-center gap-1">
          <Share2 className="w-4 h-4" />
          <span>{7}</span>
        </div>
      </div>
      {/* Modal */}
      <CommentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postId={post._id}
        onCommentAdded={() => setCommentCount((prev) => prev + 1)}
         onCommentDeleted={() => setCommentCount((prev) => prev - 1)} 
      />
    </div>
  );
};

export default PostCard;
