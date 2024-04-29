import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  audios: [],
  currentAudio: { index: 0, audio: null, uri: '' },
  audioTimeoutRefId: null,
  volume: 0,
  isAudioPaused: false,
  audioStartTime: null,
  remainingPausedAudioTime: null,
  playlistDuration: null,
}

const audioControlsSlice = createSlice({
  name: 'audioControls',
  initialState: initialState,
  reducers: {
    setAudios: (state, { payload }) => {
      state.audios = payload
    },
    setCurrentAudio: (state, { payload }) => {
      state.currentAudio = payload
    },
    setAudioTimeoutRefId: (state, { payload }) => {
      state.audioTimeoutRefId = payload
    },
    setVolume: (state, { payload }) => {
      state.volume = payload
    },
    setAudioPausedState: (state, { payload }) => {
      state.isAudioPaused = payload
    },
    setAudioStartTime: (state, { payload }) => {
      state.audioStartTime = payload
    },
    setRemainingPausedAudioTime: (state, { payload }) => {
      state.remainingPausedAudioTime = payload
    },
    setPlaylistDuration: (state, { payload }) => {
      state.playlistDuration = payload
    },
    resetState: state => {
      Object.assign(state, initialState);
    }
  }
})

export const {
  setAudios,
  setCurrentAudio,
  setAudioTimeoutRefId,
  setVolume,
  setAudioPausedState,
  setAudioStartTime,
  setRemainingPausedAudioTime,
  setPlaylistDuration,
  resetState
} = audioControlsSlice.actions

export default audioControlsSlice.reducer
