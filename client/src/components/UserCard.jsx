import React from "react";
import { UserPlus } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchUser } from "../features/user/userSlice";
import api from "../api/axios";

const UserCard = ({ user }) => {
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // follow
  const handleFollow = async () => {
    try {
      const { data } = await api.post(
        "/api/user/follow",
        { id: user._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchUser(await getToken()));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // unfollow
  const handleUnfollow = async () => {
    try {
      const { data } = await api.post(
        "/api/user/unfollow",
        { id: user._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchUser(await getToken()));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const isFollowing = currentUser?.following.includes(user._id);

  return (
    <div
      key={user._id}
      className="p-4 pt-6 flex flex-col justify-between w-72 shadow border border-gray-200 rounded-md"
    >
      <div>
        <img
          src={user.profile_picture}
          alt=""
          className="rounded-full w-16 h-16 shadow-md mx-auto"
        />
        <p className="mt-4 font-semibold text-center">{user.full_name}</p>
        {user.username && (
          <p className="text-gray-500 font-light text-center">
            @{user.username}
          </p>
        )}
        {user.bio && (
          <p className="text-gray-600 mt-2 text-center text-sm px-4">
            {user.bio}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1">
          <span>{(user.followers ?? []).length}</span> Followers
        </div>
      </div>

      <div className="flex max-sm:flex-col gap-2 mt-4">
        {/* Follow / Unfollow Toggle */}
        {isFollowing ? (
          <button
            onClick={handleUnfollow}
            className="w-full py-2 rounded-md flex justify-center items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 active:scale-95 transition cursor-pointer"
          >
            Unfollow
          </button>
        ) : (
          <button
            onClick={handleFollow}
            className="w-full py-2 rounded-md flex justify-center items-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 active:scale-95 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-green-700" />
            Follow
          </button>
        )}

        {/* Profile Button */}
        <button
          onClick={() => navigate(`/profile/${user._id}`)}
          className="w-full p-2 text-sm rounded bg-orange-100 hover:bg-orange-200 text-orange-800 active:scale-95 transition cursor-pointer"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default UserCard;
