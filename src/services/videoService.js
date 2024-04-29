import { sendMessage } from '../app'
import { contentUri } from '../contants'
import store from '../state'
import {
  setCurrentVideo,
  setVideoTimeoutRefId,
  setVideos,
  setVideoPausedState,
  setVideoStartTime,
  setRemainingPausedVideoTime,
  resetState
} from '../state/videoControls'

const playNextVideo = video => {
  const { videos } = store.getState().videoControls
  if (video.index < videos.length - 1) {
    if (videos[video.index + 1]?.duration === 0) {
      if (video.index + 2 < videos.length) {
        store.dispatch(
          setCurrentVideo({
            index: video.index + 2,
            video: videos[video.index + 2],
            uri: `${contentUri?.CUBBIE_PATH}%2F${
              videos[video.index + 2]?.fileName
            }`
          })
        )
        playVideo(video.index + 2, videos[video.index + 2])
      } else {
        store.dispatch(
          setCurrentVideo({
            index: 0,
            video: videos[0],
            uri: `${contentUri?.CUBBIE_PATH}%2F${videos[0]?.fileName}`
          })
        )
        playVideo(0, videos[0])
      }
    } else {
      store.dispatch(
        setCurrentVideo({
          index: video.index + 1,
          video: videos[video.index + 1],
          uri: `${contentUri?.CUBBIE_PATH}%2F${
            videos[video.index + 1]?.fileName
          }`
        })
      )
      playVideo(video.index + 1, videos[video.index + 1])
    }
  } else {
    if (videos[0]?.duration === 0) {
      store.dispatch(
        setCurrentVideo({
          index: video.index + 1,
          video: videos[video.index + 1],
          uri: `${contentUri?.CUBBIE_PATH}%2F${
            videos[video.index + 1]?.fileName
          }`
        })
      )
      playVideo(video.index + 1, videos[video.index + 1])
    } else {
      store.dispatch(
        setCurrentVideo({
          index: 0,
          video: videos[0],
          uri: `${contentUri?.CUBBIE_PATH}%2F${videos[0]?.fileName}`
        })
      )
      playVideo(0, videos[0])
    }
  }
}

const playVideo = (index, videoFile) => {
  const { videoTimeoutRefId, isVideoPaused } = store.getState().videoControls
  const videos = store.getState().videoControls.videos
  store.dispatch(setRemainingPausedVideoTime(null))

  if (videoTimeoutRefId) {
    clearTimeout(videoTimeoutRefId)
    store.dispatch(setVideoTimeoutRefId(null))
  }
  const videoStartTime = Date.now()
  const videoTimeout = setTimeout(
    () => playNextVideo({ index, video: videoFile }),
    videoFile?.duration * 1000
  )
  store.dispatch(setVideoStartTime(videoStartTime))
  store.dispatch(setVideoTimeoutRefId(videoTimeout))

  sendMessage(
    JSON.stringify({
      type: 'sessionData',
      category: 'video',
      video_id: videoFile?.id,
      video_playing: !isVideoPaused
    })
  )
}

const startPlayList = message => {
  const videos = message.videos
  if (videos.length > 0) {
    const command = JSON.parse(message.command)
    if (!command.takeControl) {
      store.dispatch(setVideos(videos))
      if (videos.length !== 1 || videos[0].duration !== 0) {
        store.dispatch(
          setCurrentVideo({
            index: 0,
            video: videos[0],
            uri: `${contentUri?.CUBBIE_PATH}%2F${videos[0]?.fileName}`
          })
        )
        playVideo(0, videos[0])
      } else {
        store.dispatch(
          setCurrentVideo({
            index: 0,
            video: videos[0],
            uri: `${contentUri?.CUBBIE_PATH}%2F${videos[0]?.fileName}`
          })
        )
        playVideo(0, { ...videos[0], duration: message.playlistDuration })
      }
    } else {
      const { currentVideo, isVideoPaused } = store.getState()?.videoControls
      if (videos.length > 0) {
        store.dispatch(
          setCurrentVideo({
            ...currentVideo,
            video: videos[0],
            uri: `${contentUri?.CUBBIE_PATH}%2F${videos[0]?.fileName}`
          })
        )
        sendMessage(
          JSON.stringify({
            type: 'sessionData',
            category: 'video',
            video_id: videos[0]?.id,
            video_playing: !isVideoPaused
          })
        )
      }
    }
  }
}

const stopPlayList = () => {
  const { videoTimeoutRefId } = store.getState().videoControls;

  if (videoTimeoutRefId) {
    clearTimeout(videoTimeoutRefId);
    store.dispatch(resetState());
  }

  store.dispatch(setCurrentVideo({ index: 0, uri: '', video: null }))
}

const setVideoState = command => {
  const {
    videoTimeoutRefId,
    videos,
    currentVideo,
    videoStartTime,
    remainingPausedVideoTime
  } = store.getState().videoControls

  if (command.action === 'pause') {
    const newRemainingPausedVideoTime =
      (remainingPausedVideoTime
        ? remainingPausedVideoTime
        : videos[currentVideo.index]?.duration * 1000) -
      (Date.now() - videoStartTime)

    store.dispatch(setRemainingPausedVideoTime(newRemainingPausedVideoTime))
    clearTimeout(videoTimeoutRefId)
  }

  if (command.action === 'resume' && remainingPausedVideoTime) {
    const videoStartTime = Date.now()
    const videoTimeout = setTimeout(
      () =>
        playNextVideo({
          index: currentVideo.index,
          video: videos[currentVideo.index]
        }),
      remainingPausedVideoTime
    )
    store.dispatch(setVideoStartTime(videoStartTime))
    store.dispatch(setVideoTimeoutRefId(videoTimeout))
  }

  sendMessage(
    JSON.stringify({
      type: 'sessionData',
      category: 'video',
      video_id: currentVideo?.video?.id,
      video_playing: !(command.action === 'pause')
    })
  )
  store.dispatch(setVideoPausedState(command.action === 'pause'))
}

const videoService = message => {
  const command = JSON.parse(message.command)
  if (command.action === 'start_playlist') {
    startPlayList(message)
  }

  if (command.action === 'stop_playlist') {
    stopPlayList()
  }

  if (command.action === 'pause' || command.action === 'resume') {
    setVideoState(command)
  }
}

export default { videoService }
