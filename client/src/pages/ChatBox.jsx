// components/ChatBox.jsx
import React, { useEffect, useRef, useState } from "react";
import { ImageIcon, Paperclip, SendHorizonal } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { addMessages, fetchMessage, resetMessages } from "../features/messages/messagesSlice";

const ChatBox = () => {
  const { messages } = useSelector((state) => state.messages);
  const connections = useSelector((state) => state.connections.connections);

  const { userId } = useParams();
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);

  const messagesEndRef = useRef(null);

  // Fetch messages for this user
  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      dispatch(fetchMessage({ token, userId }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Send message (text/image/file)
  const sendMessage = async () => {
    if (!text && !image && !file) return;

    const toastId = toast.loading("Sending message...");

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("to_user_id", userId);
      formData.append("text", text || "");
      if (image) formData.append("image", image);
      if (file) formData.append("file", file);

      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data.success) throw new Error(data.message);

      setText("");
      setImage(null);
      setFile(null);
      dispatch(addMessages(data.message));

      toast.success("Message sent!", { id: toastId });
    } catch (error) {
      toast.error(error.message || "Failed to send message", { id: toastId });
    }
  };

  // Load messages on mount and when userId changes
  useEffect(() => {
    fetchUserMessages();
    return () => void dispatch(resetMessages());
  }, [userId]);

  // Set user info from connections
  useEffect(() => {
    if (connections.length > 0) {
      const u = connections.find((c) => c._id === userId);
      setUser(u);
    }
  }, [connections, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 md:px-10 xl:pl-40 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
        <img src={user.profile_picture} alt="" className="size-8 rounded-full" />
        <div>
          <p className="font-medium">{user.full_name}</p>
          <p className="text-sm text-gray-500 -ml-1.5">@{user.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 md:px-10 h-full overflow-y-scroll">
        <div className="space-y-4 max-w-4xl mx-auto">
          {[...messages]
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((message, index) => {
              const isMine = message.to_user_id !== user._id;
              return (
                <div key={index} className={`flex flex-col ${isMine ? "items-start" : "items-end"}`}>
                  <div
                    className={`p-2 text-sm max-w-sm bg-white rounded-lg shadow ${
                      isMine ? "rounded-bl-none" : "rounded-br-none"
                    }`}
                  >
                    {/* Image */}
                    {message.message_type === "image" && message.media_url && (
                      <img
                        src={message.media_url}
                        className="w-full max-w-sm rounded-lg mb-1"
                        alt={message.file_name || "image"}
                      />
                    )}

                    {/* File */}
                    {message.message_type === "file" && message.media_url && (
                      <a
                        href={message.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={message.file_name || true}
                        className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg max-w-sm break-all hover:bg-gray-200"
                      >
                        <Paperclip className="w-4 h-4 text-gray-700" />
                        <span className="truncate">{message.file_name || "Download file"}</span>
                      </a>
                    )}

                    {/* Text */}
                    {message.text && <p>{message.text}</p>}
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="px-4">
        <div className="flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5">
          <input
            type="text"
            className="flex-1 outline-none text-slate-700"
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            onChange={(e) => setText(e.target.value)}
            value={text}
          />

          {/* Image picker */}
          <label htmlFor="image">
            {image ? (
              <img src={URL.createObjectURL(image)} alt="" className="w-8 h-8 object-cover rounded" />
            ) : (
              <ImageIcon className="size-7 text-gray-400 cursor-pointer" />
            )}
            <input
              type="file"
              id="image"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </label>

          {/* File picker */}
          <label htmlFor="file" className="max-w-[120px] truncate cursor-pointer">
            {file ? (
              <span className="text-sm text-gray-600 truncate inline-block align-middle">
                {file.name}
              </span>
            ) : (
              <Paperclip className="size-6 text-gray-400" />
            )}
            <input
              type="file"
              id="file"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <button
            onClick={sendMessage}
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 cursor-pointer text-white p-2 rounded-full"
          >
            <SendHorizonal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
