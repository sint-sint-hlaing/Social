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
    addMessages: (state, action) => {
      state.messages = [...state.messages, action.payload];
    },
    resetMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMessage.fulfilled, (state, action) => {
      state.messages = action.payload; // payload is now messages array
    });
  },
});

export const { setMessages, addMessages, resetMessages } =
  messagesSlice.actions;
export default messagesSlice.reducer;
