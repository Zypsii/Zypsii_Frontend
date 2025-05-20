import { configureStore } from '@reduxjs/toolkit';
import storiesReducer from './reducers/storiesReducer';

const store = configureStore({
  reducer: {
    stories: storiesReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export { store }; 