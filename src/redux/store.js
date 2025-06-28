import { configureStore } from '@reduxjs/toolkit';
import storiesReducer from './reducers/storiesReducer';
import scheduleReducer from './slices/scheduleSlice';
import splitReducer from './slices/splitSlice';
import mainLandingReducer from './slices/mainLandingSlice';

const store = configureStore({
  reducer: {
    stories: storiesReducer,
    schedule: scheduleReducer,
    split: splitReducer,
    mainLanding: mainLandingReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      thunk: true
    }),
});

export { store }; 