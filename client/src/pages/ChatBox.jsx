// components/ChatBox.jsx
import React, { useEffect, useRef, useState } from "react";
import { ImageIcon, Paperclip, SendHorizonal } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import {
  addMessages,
  fetchMessage,
  resetMessages,
  markMessagesDelivered,
  markMessagesSeen,
  upsertMessage,
} from "../features/messages/messagesSlice";

const ChatBox = () => {
  const { messages } = useSelector((state) => state.messages);
  const connections = useSelector((state) => state.connections?.connections || []);

  const { userId: otherUserId } = useParams(); // other user (chat partner)
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser(); // Clerk hook for the current user
  const me = clerkUser?.id || clerkUser?._id || ""; // normalized current user id
  const dispatch = useDispatch();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);

  const messagesEndRef = useRef(null);
  const sseRef = useRef(null);

  // Helper: normalize sender id from message object
  const getFromId = (message) => {
    const f = message?.from_user_id;
    if (!f) return "";
    if (typeof f === "string") return f;
    // If populated object, try common id fields
    return (f._id && f._id.toString && f._id.toString()) ||
           (f.id && f.id.toString && f.id.toString()) ||
           (f.userId && f.userId.toString && f.userId.toString()) ||
           "";
  };

  // Fetch messages for this user
  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      dispatch(fetchMessage({ token, userId: otherUserId }));
    } catch (error) {
      toast.error(error.message || "Failed to fetch messages");
    }
  };

  // Send message (text/image/file)
  const sendMessage = async () => {
    if (!text && !image && !file) return;

    const toastId = toast.loading("Sending message...");

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("to_user_id", otherUserId);
      formData.append("text", text || "");
      if (image) formData.append("image", image);
      if (file) formData.append("file", file);

      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data.success) throw new Error(data.message || "Send failed");

      setText("");
      setImage(null);
      setFile(null);

      // upsert the returned message so we don't duplicate if SSE also sends it
      dispatch(upsertMessage(data.message));

      toast.success("Message sent!", { id: toastId });
    } catch (error) {
      toast.error(error.message || "Failed to send message", { id: toastId });
    }
  };

  // Load messages on mount and when otherUserId changes
  useEffect(() => {
    fetchUserMessages();
    return () => void dispatch(resetMessages());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId]);

  // Set user info from connections (your existing connections store)
  useEffect(() => {
    if (Array.isArray(connections) && connections.length > 0) {
      const u = connections.find((c) => c._id === otherUserId || c.id === otherUserId);
      setUser(u || null);
    }
  }, [connections, otherUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SSE: connect as current user (me)
  useEffect(() => {
    if (!me) return;

    const url = `/api/sse/${me}`;
    const es = new EventSource(url);
    sseRef.current = es;

    es.addEventListener("connected", () => {
      // optionally handle connect
    });

    // Incoming message (someone sent me a message)
    es.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        dispatch(upsertMessage(msg));
      } catch (err) {
        console.error("SSE message parse error:", err);
      }
    });

    // Delivered event
    es.addEventListener("delivered", (ev) => {
      try {
        const payload = JSON.parse(ev.data); // { messageIds: [...], to_user_id }
        const ids = payload?.messageIds || [];
        if (ids.length) dispatch(markMessagesDelivered(ids));
      } catch (err) {
        console.error("SSE delivered parse error:", err);
      }
    });

    // Seen event
    es.addEventListener("seen", (ev) => {
      try {
        const payload = JSON.parse(ev.data); // { messageIds: [...], by: userId }
        const ids = payload?.messageIds || [];
        if (ids.length) dispatch(markMessagesSeen(ids));
      } catch (err) {
        console.error("SSE seen parse error:", err);
      }
    });

    es.onerror = (err) => {
      console.warn("SSE error", err);
    };

    return () => {
      es.close();
    };
  }, [me, dispatch]);

  // If we don't have the other user's connection data, still render using a fallback header
  if (!user) {
    // Show a minimal header while waiting for connections lookup
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center gap-2 p-2 md:px-10 xl:pl-40 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div>
            <p className="font-medium">Loading...</p>
            <p className="text-sm text-gray-500 -ml-1.5">@{otherUserId}</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Loading conversation...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 md:px-10 xl:pl-40 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
        <img src={user.profile_picture} alt="" className="w-8 h-8 rounded-full object-cover" />
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
              const fromId = getFromId(message);
              const isMine = fromId === me;

              // bubble alignment classes
              const containerAlign = isMine ? "items-end" : "items-start";
              const bubbleRadius = isMine ? "rounded-bl-none" : "rounded-br-none";

              return (
                <div key={message._id || index} className={`flex flex-col ${containerAlign}`}>
                  <div
                    className={`p-2 text-sm max-w-sm bg-white rounded-lg shadow ${bubbleRadius}`}
                  >
                    {/* Image */}
                    {message.message_type === "image" && message.media_url && (
                      <img
                        src={message.media_url}
                        className="w-full max-w-sm rounded-lg mb-1 object-cover"
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

                    {/* status (for messages I sent) */}
                    {isMine && (
                      <div className="text-xs mt-1 text-gray-500 text-right">
                        {message.seen ? (
                          <span>Seen</span>
                        ) : message.delivered ? (
                          <span>Delivered</span>
                        ) : (
                          <span>Sent</span>
                        )}
                      </div>
                    )}
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
          <label htmlFor="image" className="cursor-pointer">
            {image ? (
              <img src={URL.createObjectURL(image)} alt="" className="w-8 h-8 object-cover rounded" />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400 cursor-pointer" />
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
              <Paperclip className="w-6 h-6 text-gray-400" />
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
