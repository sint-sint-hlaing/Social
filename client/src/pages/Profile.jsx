import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import UserProfileInfo from "../components/UserProfileInfo";
import PostCard from "../components/PostCard";
import moment from "moment";
import ProfileModal from "../components/ProfileModal";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import api from "../api/axios";

const Profile = () => {
  const currentUser = useSelector((state) => state.user.value);
  const { profileId } = useParams();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const { getToken } = useAuth();
  const [userPosts, setUserPosts] = useState([]); // only my posts
  const [posts, setPosts] = useState([]); // tab display posts

  const fetchUser = async (profileId) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/user/profiles`,
        { profileId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        const userSavedPosts = (data.profile.saved_posts || []).map((id) =>
          id.toString()
        );

        const postsWithSaved = data.posts.map((p) => ({
          ...p,
          _id: p._id.toString(),
          savedByCurrentUser: userSavedPosts.includes(p._id.toString()),
        }));

        setUser(data.profile);

        // 👉 these are only this user’s own posts
        setUserPosts(postsWithSaved);

        // 👉 by default, tab "posts" shows userPosts
        setPosts(postsWithSaved);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/saved", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        const savedPosts = data.posts.map((p) => ({
          ...p,
          _id: p._id.toString(),
          savedByCurrentUser: true,
        }));
        setPosts(savedPosts);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    // fetch user ONCE when profileId or currentUser changes
    if (profileId) {
      fetchUser(profileId);
    } else {
      fetchUser(currentUser._id);
    }
  }, [profileId, currentUser]);

  // handle tab switching separately
  useEffect(() => {
    if (activeTab === "saved") {
      fetchSavedPosts();
    } else if (activeTab === "posts") {
      setPosts(userPosts); // only my posts
    } else if (activeTab === "media") {
      setPosts(userPosts); // 👈 make media use only my posts too
    }
  }, [activeTab, userPosts]);

  const handlePostDeleted = (postId) => {
    // Remove from both userPosts and posts (current tab display)
    setUserPosts((prev) => prev.filter((p) => p._id !== postId));
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  return user ? (
    <div className="relative h-full overflow-y-scroll bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {/* Cover Photo */}
          <div className="h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
            {user.cover_photo && (
              <img
                src={user.cover_photo}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {/* User Info */}
          <UserProfileInfo
            user={user}
            posts={userPosts}
            profileId={profileId}
            setShowEdit={setShowEdit}
          />
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow p-1 flex max-w-md mx-auto">
             {["posts", "media", ...(profileId === currentUser._id ? ["saved"] : [])].map(
    (tab) => (
      <button
        onClick={() => setActiveTab(tab)}
        key={tab}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
          activeTab === tab
            ? "bg-cyan-500 text-white"
            : "text-cyan-600 hover:text-cyan-500"
        }`}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    )
  )}
          </div>

          {/* Posts */}
          {activeTab === "posts" && (
            <div className="mt-6 flex flex-col items-center gap-6">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onDelete={() => handlePostDeleted(post._id)}
                />
              ))}
            </div>
          )}

          {/* Media */}
          {activeTab === "media" && (
            <div className="flex flex-wrap mt-6 max-w-6xl">
              {userPosts
                .filter((post) => post.image_urls.length > 0)
                .map((post) =>
                  post.image_urls.map((image, index) => (
                    <Link
                      className="relative group"
                      target="_blank"
                      to={image}
                      key={index}
                    >
                      <img
                        src={image}
                        className="w-64 aspect-video object-cover"
                        alt=""
                      />
                      <p className="absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300">
                        Posted {moment(post.createdAt).fromNow()}
                      </p>
                    </Link>
                  ))
                )}
            </div>
          )}

          {/* Saved */}
          {activeTab === "saved" && (
            <div className="mt-6 flex flex-col items-center gap-6">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onToggleSaved={(postId, isSaved) => {
                    if (!isSaved) {
                      // Remove post from the saved tab immediately
                      setPosts((prev) => prev.filter((p) => p._id !== postId));
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEdit && <ProfileModal setShowEdit={setShowEdit} />}
    </div>
  ) : (
    <Loading />
  );
};

export default Profile;
