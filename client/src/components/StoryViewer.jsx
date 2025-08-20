import { useAuth } from "@clerk/clerk-react";
import { BadgeCheck, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import api from "../api/axios";

const StoryViewer = ({ viewStory, setViewStory }) => {
  const [progress, setProgress] = useState(0);
    const { getToken } = useAuth();
  const [viewers, setViewers] = useState([]);

  useEffect(() => {
    if (!viewStory) return;

    const recordView = async () => {
      const token = await getToken();
      try {
        const { data } = await api.post(`/api/story/view/${viewStory._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) setViewers(data.viewers);
      } catch (error) {
        console.log(error.message);
      }
    };

    recordView();
  }, [viewStory]);


  useEffect(() => {
    let timer, progressInterval;
    if (viewStory && viewStory.media_type !== "video") {
      setProgress(0);
      const duration = 10000;
      const setTime = 100;
      let elapsed = 0;

      progressInterval = setInterval(() => {
        elapsed += setTime;
        setProgress((elapsed / duration) * 100);
      }, setTime);

      timer = setTimeout(() => {
        setViewStory(null);
      }, duration);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [viewStory, setViewStory]);

  const handleClose = () => {
    setViewStory(null);
  };

  if (!viewStory) return null;

  const renderContent = () => {
    switch (viewStory.media_type) {
      case "image":
        return (
          <img
            className="max:w-full
                     max-h-screen object-contain"
            src={viewStory.media_url}
            alt=""
          />
        );
      case "video":
        return (
          <video
            onEnded={() => setViewStory(null)}
            className="
                     max-h-screen"
            src={viewStory.media_url}
            alt=""
            controls
            autoPlay
          />
        );
      case "text":
        return (
          <div className=" w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center">
            {viewStory.content}
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div
      className="fixed inset-0 h-screen bg-black bg-opacity-95 z-110 flex items-center justify-center"
      style={{
        backgroundColor:
          viewStory.media_type === "text"
            ? viewStory.background_color
            : "#000000",
      }}
    >
      {/* Progress Bar */}
      <div className=" absolute top-0 left-0 w-full h-1 bg-gray-700">
        <div
          className="h-full bg-white transition-all duration-100 linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* User Info -Top left */}
      <div className=" absolute top-4 left-4 flex items-center space-x-3 p-2 px-4 sm:p-4 sm:px-8 backdrop-blur-2xl rounded bg-black/50">
        <img
          src={viewStory.user?.profile_picture}
          alt=""
          className=" size-7 sm:size-8 rounded-full object-cover border border-white"
        />
        <div className="text-white font-medium flex items-center gap-1.5">
          <span className="">{viewStory.user?.full_name}</span>
          <BadgeCheck size={18} />
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none"
      >
        <X className="w-8 h-8 hover:scale-110 transition cursor-pointer" />
      </button>

      {/* Content Wrapper */}
      <div className="max-w-[90ww] max-h-[90vh] flex justify-center items-center ">
        {renderContent()}
      </div>



      <div className="absolute bottom-4 left-4 flex items-center gap-2">
  {viewers.map((v) => (
    <img
      key={v._id}
      src={v.profile_picture}
      alt={v.full_name}
      title={v.full_name}
      className="w-6 h-6 rounded-full border border-white"
    />
  ))}
</div>
    </div>
  );
};

export default StoryViewer;
