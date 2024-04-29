import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  videos: [],
  currentVideo: { index: 0, uri: '', video: null },
  videoTimeoutRefId: null,
  isVideoPaused: false,
  videoStartTime: null,
  remainingPausedVideoTime: null,
  isShowFadeOut: false,
  client: null,
}

const videoControlsSlice = createSlice({
  name: 'videoControls',
  initialState: initialState,
  reducers: {
    setVideos: (state, { payload }) => {
      state.videos = payload
    },
    setCurrentVideo: (state, { payload }) => {
      state.currentVideo = payload
    },
    setVideoTimeoutRefId: (state, { payload }) => {
      state.videoTimeoutRefId = payload
    },
    setVideoPausedState: (state, { payload }) => {
      state.isVideoPaused = payload
    },
    setVideoStartTime: (state, { payload }) => {
      state.videoStartTime = payload
    },
    setRemainingPausedVideoTime: (state, { payload }) => {
      state.remainingPausedVideoTime = payload
    },
    setIsShowFadeOut: (state, { payload }) => {
      state.isShowFadeOut = payload
    },
    setClient: (state, { payload }) => {
      state.client = payload
    },
    resetState: state => {
      Object.assign(state, initialState)
    }
  }
})

export const {
  setVideos,
  setCurrentVideo,
  setVideoTimeoutRefId,
  setVideoPausedState,
  setVideoStartTime,
  setRemainingPausedVideoTime,
  setIsShowFadeOut,
  setClient,
  resetState
} = videoControlsSlice.actions

export default videoControlsSlice.reducer
