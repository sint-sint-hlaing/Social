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

  const { userId: otherUserId } = useParams(); // chat partner id from route
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser(); // Clerk hook
  const me = clerkUser?.id || clerkUser?._id || ""; // normalized current user id
  const dispatch = useDispatch();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);

  const messagesEndRef = useRef(null);
  const sseRef = useRef(null);

  // Helper: normalize sender id from message object (string or populated object)
  const getFromId = (message) => {
    const f = message?.from_user_id;
    if (!f) return "";
    if (typeof f === "string") return String(f);
    // common object id fields
    if (f._id) return String(f._id);
    if (f.id) return String(f.id);
    if (f.userId) return String(f.userId);
    return "";
  };

  // Fetch messages for this chat partner (calls your thunk which hits /api/message/get)
  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      await dispatch(fetchMessage({ token, userId: otherUserId })).unwrap();
      // fetchMessage route should mark messages as seen server-side (your server's logic)
      // After fetch, scroll to bottom (messages will update via slice)
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("fetchUserMessages error:", error);
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

      // Upsert the returned message to avoid duplication if SSE also pushes it
      dispatch(upsertMessage(data.message));
      toast.success("Message sent!", { id: toastId });
    } catch (error) {
      console.error("sendMessage error:", error);
      toast.error(error.message || "Failed to send message", { id: toastId });
    }
  };

  // Load messages on mount and whenever the chat partner changes
  useEffect(() => {
    fetchUserMessages();
    return () => void dispatch(resetMessages());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId]);

  // Set chat partner user info from connections store (fallbacks possible)
  useEffect(() => {
    if (Array.isArray(connections) && connections.length > 0) {
      // your connections items appear to use _id or id
      const u = connections.find((c) => c._id === otherUserId || c.id === otherUserId);
      setUser(u || null);
    }
  }, [connections, otherUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SSE: connect as current user (me). Only one EventSource; close previous if exists.
  useEffect(() => {
    if (!me) {
      console.warn("SSE: current user id not available yet");
      return;
    }

    // close previous ES if any
    if (sseRef.current) {
      try {
        sseRef.current.close();
      } catch (err) {
        // ignore
      }
      sseRef.current = null;
    }

    
    const url = `/api/message/${me}`; 

    console.log("SSE: connecting to", url);
    const es = new EventSource(url);
    sseRef.current = es;

    es.onopen = (ev) => {
      console.log("SSE open", ev);
    };

    // Generic/default message event (server might send either named events or raw data)
    es.onmessage = (ev) => {
      try {
        // try parse JSON; sometimes server might emit raw text
        const payload = JSON.parse(ev.data);
        console.log("SSE onmessage payload:", payload);

        // If it's a message object (has _id or text or message_type), upsert it
        if (payload && (payload._id || payload.message_type || payload.text || payload.media_url)) {
          dispatch(upsertMessage(payload));
          return;
        }

        // If it's a control object (messageIds etc.), handle similar to named events
        if (payload && payload.messageIds) {
          // infer type: server should send named events for clarity, but handle defensively
          // If payload.by exists -> seen; else if payload.to_user_id exists -> delivered
          if (payload.by) {
            const ids = (payload.messageIds || []).map(String);
            console.log("SSE onmessage inferred seen:", ids);
            if (ids.length) dispatch(markMessagesSeen(ids));
          } else {
            const ids = (payload.messageIds || []).map(String);
            console.log("SSE onmessage inferred delivered:", ids);
            if (ids.length) dispatch(markMessagesDelivered(ids));
          }
          return;
        }

      } catch (err) {
        console.warn("SSE onmessage parse error:", err, ev.data);
      }
    };

    // Named 'message' event (some servers emit `event: message`)
    es.addEventListener("message", (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        console.log("SSE event 'message' payload:", payload);
        // handle like above
        if (payload && (payload._id || payload.message_type || payload.text || payload.media_url)) {
          dispatch(upsertMessage(payload));
        }
      } catch (err) {
        console.error("SSE 'message' parse error:", err, ev.data);
      }
    });

    // Named 'delivered' event
    es.addEventListener("delivered", (ev) => {
      try {
        const payload = JSON.parse(ev.data); // { messageIds: [...], to_user_id }
        console.log("SSE event 'delivered' received:", payload);
        const ids = (payload?.messageIds || []).map(String);
        if (ids.length) dispatch(markMessagesDelivered(ids));
      } catch (err) {
        console.error("SSE 'delivered' parse error:", err, ev.data);
      }
    });

    // Named 'seen' event
    es.addEventListener("seen", (ev) => {
  console.log("SSE event 'seen' raw:", ev.data);
  try {
    const payload = JSON.parse(ev.data); // { messageIds: [...], by: userId } or { messages: [...] }
    console.log("SSE 'seen' payload parsed:", payload);
    const ids = (payload?.messageIds || payload?.messages?.map(m => m._id) || []).map(String);
    if (ids.length) dispatch(markMessagesSeen(ids));
    // If server sends full message objects, you could also dispatch upsert for each:
    if (payload?.messages) {
      payload.messages.forEach((m) => dispatch(upsertMessage(m)));
    }
  } catch (err) {
    console.error("SSE 'seen' parse error:", err, ev.data);
  }
});

    es.onerror = (err) => {
      console.warn("SSE error", err);
      // don't close here; EventSource will attempt reconnect automatically
    };

    return () => {
      try {
        es.close();
        console.log("SSE closed");
      } catch (err) {
        // ignore
      }
      sseRef.current = null;
    };
  }, [me, dispatch]);

  // Fallback minimal header while other user's profile is not yet available
  if (!user) {
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
              const isMine = String(fromId) === String(me);

              const containerAlign = isMine ? "items-end" : "items-start";
              const bubbleRadius = isMine ? "rounded-bl-none" : "rounded-br-none";

              return (
                <div key={message._id || index} className={`flex flex-col ${containerAlign}`}>
                  <div className={`p-2 text-sm max-w-sm bg-white rounded-lg shadow ${bubbleRadius}`}>
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
