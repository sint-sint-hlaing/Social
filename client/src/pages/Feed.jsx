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
import { BookOpen, Search } from "lucide-react";

const Feed = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { getToken } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  useEffect(() => {
    // whenever URL search changes, update input value
    setSearchTerm(urlSearch || "");

    if (urlSearch) fetchFeeds(urlSearch);
    else fetchFeeds();
  }, [urlSearch]);

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

  const handleSearchClick = () => {
    if (!searchTerm) return;
    setSearchParams({ search: searchTerm }); // update URL
    fetchFeeds(searchTerm); // fetch posts
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchClick();
              }
            }}
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
                  setFeeds((prev) =>
                    prev.map((p) =>
                      p._id === postId
                        ? { ...p, savedByCurrentUser: isSaved }
                        : p
                    )
                  );
                }}
                onClickHashtag={(hashtag) => {
                  setSearchTerm(hashtag); // put hashtag into input
                  setSearchParams({ search: hashtag }); // update URL
                  fetchFeeds(hashtag); // trigger search
                }}
              />
            ))
          ) : (
            <p className="text-gray-500">No posts found.</p>
          )}
        </div>
      </div>

      <div className="max-xl:hidden sticky top-0">
        {/* <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-4 w-64">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-700" />
            Recommended Resources
          </h3>

         
          {[
            {
              title: "Python Data Structures",
              type: "PDF",
              author: "Dr. Emily Wang",
              link: "#",
            },
            {
              title: "React Hooks Tutorial",
              type: "Video",
              author: "CS101 Instructor",
              link: "#",
            },
            {
              title: "Algorithm Practice Questions",
              type: "Article",
              author: "Alice Doe",
              link: "#",
            },
          ].map((resource, idx) => (
            <a
              key={idx}
              href={resource.link}
              className="flex flex-col p-3 bg-gray-50 hover:bg-gray-100 rounded-lg shadow-sm transition-colors"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {resource.title}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {resource.type}
                </span>
              </div>
              <p className="text-xs text-gray-500">by {resource.author}</p>
            </a>
          ))}

          <a
            href="/resources"
            className="mt-2 text-sm text-blue-500 hover:underline font-medium"
          >
            See all resources →
          </a>
        </div> */}

        <RecentMessages />
      </div>
    </div>
  );
};

export default Feed;
