import { configureStore } from '@reduxjs/toolkit';
import storiesReducer from './reducers/storiesReducer';
import scheduleReducer from './slices/scheduleSlice';
import splitReducer from './slices/splitSlice';

const store = configureStore({
  reducer: {
    stories: storiesReducer,
    schedule: scheduleReducer,
    split: splitReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      thunk: true
    }),
});

export { store }; 