import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";
import RecentMessages from "../components/RecentMessages";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { Search } from "lucide-react";

const Feed = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { getToken } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  // Fetch user saved posts
  const fetchUserSavedPosts = async () => {
    try {
      const { data } = await api.get("/api/saved", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) return data.posts.map((p) => p._id.toString());
      return [];
    } catch (error) {
      toast.error(error.message);
      return [];
    }
  };

  // Fetch feed posts and mark saved posts
  const fetchFeeds = async (search = "") => {
    try {
      setLoading(true);
      const token = await getToken();

      const { data } = await api.get("/api/post/feed", {
        params: { search },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const savedIds = await fetchUserSavedPosts();

        const feedsWithSaved = data.posts.map((p) => ({
          ...p,
          _id: p._id.toString(),
          savedByCurrentUser: savedIds.includes(p._id.toString()),
        }));

        setFeeds(feedsWithSaved);
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (urlSearch) fetchFeeds(urlSearch); // fetch posts based on URL
    else fetchFeeds(); // fetch all posts if no search
  }, [urlSearch]);

  const handleSearchClick = () => {
    if (!searchTerm) return;

    // Update URL
    setSearchParams({ search: searchTerm });

    // Fetch posts
    fetchFeeds(searchTerm);

    // Clear input immediately
    setSearchTerm("");
  };

  if (loading) return <Loading />;

  return (
    <div className="h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8">
      <div>
        <div className="px-4 mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-2 border border-orange-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <button
            onClick={handleSearchClick}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-1"
          >
            <Search size={20} className="w-4 h-4" />
          </button>
        </div>

        <StoriesBar />

        <div className="p-4 space-y-6">
          {feeds.length > 0 ? (
            feeds.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={(deletedId) =>
                  setFeeds((prev) => prev.filter((p) => p._id !== deletedId))
                }
                onToggleSaved={(postId, isSaved) => {
                  // Update the feeds state immediately when saving/unsaving
                  setFeeds((prev) =>
                    prev.map((p) =>
                      p._id === postId
                        ? { ...p, savedByCurrentUser: isSaved }
                        : p
                    )
                  );
                }}
              />
            ))
          ) : (
            <p className="text-gray-500">No posts found.</p>
          )}
        </div>
      </div>

      <div className="max-xl:hidden sticky top-0">
        <div className="max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow">
          <h3 className="text-slate-800 font-semibold">Sponsered</h3>
          <img
            src={assets.sponsored_img}
            className="w-75 h-50 rounded-md"
            alt=""
          />
          <p className="text-slate-600">Email marketing</p>
          <p>
            Supercharge your marketing with a powerful, easy-to-use platform
            built for results.
          </p>
        </div>
        <RecentMessages />
      </div>
    </div>
  );
};

export default Feed;
