import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  seenStories: {}
};

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    markStorySeen: (state, action) => {
      const { userId, storyId } = action.payload;
      if (!state.seenStories[userId]) {
        state.seenStories[userId] = [];
      }
      if (!state.seenStories[userId].includes(storyId)) {
        state.seenStories[userId].push(storyId);
      }
    }
  }
});

export const { markStorySeen } = storiesSlice.actions;
export default storiesSlice.reducer; 