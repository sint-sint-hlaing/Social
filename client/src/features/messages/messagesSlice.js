import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  messages: [],
};

export const fetchMessage = createAsyncThunk(
  "messages/fetchMessage",
  async ({ token, userId }) => {
    const { data } = await api.post(
      "/api/message/get",
      { to_user_id: userId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (data.success) {
      return data.messages; // return only messages array
    } else {
      throw new Error("Failed to fetch messages");
    }
  }
);

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },

    /**
     * addMessages:
     * - Accepts a single message object or an array of messages.
     * - Upserts to avoid duplicates (based on _id).
     */
    addMessages: (state, action) => {
      const payload = action.payload;
      const toAdd = Array.isArray(payload) ? payload : [payload];

      toAdd.forEach((m) => {
        const idx = state.messages.findIndex((x) => x._id === m._id);
        if (idx === -1) state.messages.push(m);
        else state.messages[idx] = { ...state.messages[idx], ...m };
      });
    },

    /**
     * upsertMessage:
     * - Convenience reducer to upsert a single message (used by SSE).
     */
        upsertMessage(state, action) {
      const msg = action.payload;
      if (!msg || !msg._id) return;
      const id = String(msg._id);
      const idx = state.messages.findIndex(m => String(m._id) === id);
      if (idx > -1) {
        // merge existing (preserve other fields)
        state.messages[idx] = { ...state.messages[idx], ...msg };
      } else {
        state.messages.push(msg);
      }
    },
    markMessagesDelivered(state, action) {
      const ids = (action.payload || []).map(String);
      state.messages = state.messages.map(m =>
        ids.includes(String(m._id)) ? { ...m, delivered: true } : m
      );
    },
    markMessagesSeen(state, action) {
      const ids = (action.payload || []).map(String);
      state.messages = state.messages.map(m =>
        ids.includes(String(m._id)) ? { ...m, seen: true } : m
      );
    },

    resetMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMessage.fulfilled, (state, action) => {
      state.messages = action.payload; // payload is messages array
    });
  },
});

export const {
  setMessages,
  addMessages,
  upsertMessage,
  markMessagesDelivered,
  markMessagesSeen,
  resetMessages,
} = messagesSlice.actions;

export default messagesSlice.reducer;
