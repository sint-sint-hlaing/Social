import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import UserCard from "../components/UserCard";
import Loading from "../components/Loading";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "../features/user/userSlice";

const Discover = () => {
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  // Fetch latest 6 users
  const fetchNewUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/user/new", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setUsers(data.users);
      else console.error(data.message);
    } catch (error) {
      console.error(error.message);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    if (e.key === "Enter") {
      if (!input.trim()) {
        fetchNewUsers(); 
        return;
      }

      try {
        setUsers([]);
        setLoading(true);
        const { data } = await api.post(
          "/api/user/discover",
          { input },
          {
            headers: { Authorization: `Bearer ${await getToken()}` },
          }
        );
        if (data.success) {
          setUsers(data.users);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error(error.message);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchUser(token));
    });
    fetchNewUsers(); // Load latest users on page load
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Discover People
          </h1>
          <p className="text-slate-600">
            Connect with amazing people and grow your network
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 shadow-md rounded-md border border-slate-200/60 bg-white/80">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search people by name, username, bio, or location..."
                className="pl-10 sm:pl-12 py-2 w-full border border-b-gray-300 rounded-md max-sm:text-sm"
                onChange={(e) => setInput(e.target.value)}
                value={input}
                onKeyUp={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="flex flex-wrap gap-6">
          {users.length > 0 ? (
            users.map((user) => <UserCard user={user} key={user._id} />)
          ) : (
            !loading && (
              <p className="text-slate-500 text-center w-full">No user found</p>
            )
          )}
        </div>

        {loading && <Loading height="60vh" />}
      </div>
    </div>
  );
};

export default Discover;
