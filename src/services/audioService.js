import {
  setAudioTimeoutRefId,
  setAudios,
  setCurrentAudio,
  setVolume,
  setAudioPausedState,
  setRemainingPausedAudioTime,
  setAudioStartTime,
  resetState,
  setPlaylistDuration
} from '../state/audioControls'
import { contentUri } from '../contants'
import store from '../state'
import { sendMessage } from '../app'
import { VolumeManager } from 'react-native-volume-manager'
import DeviceInfo from 'react-native-device-info'
import database from '@react-native-firebase/database'

const playNextAudio = audio => {
  const { audios } = store.getState()?.audioControls

  if (audio.index < audios.length - 1) {
    if (audios[audio.index + 1]?.duration === 0) {
      if (audio.index + 2 < audios.length) {
        store.dispatch(
          setCurrentAudio({
            index: audio.index + 2,
            audio: audios[audio.index + 2],
            uri: `${contentUri.CUBBIE_PATH}%2F${
              audios[audio.index + 2]?.fileName
            }`
          })
        )
        playAudio(audio.index + 2, audios[audio.index + 2])
      } else {
        store.dispatch(
          setCurrentAudio({
            index: 0,
            audio: audios[0],
            uri: `${contentUri.CUBBIE_PATH}%2F${audios[0]?.fileName}`
          })
        )
        playAudio(0, audios[0])
      }
    } else {
      store.dispatch(
        setCurrentAudio({
          index: audio.index + 1,
          audio: audios[audio.index + 1],
          uri: `${contentUri.CUBBIE_PATH}%2F${
            audios[audio.index + 1]?.fileName
          }`
        })
      )
      playAudio(audio.index + 1, audios[audio.index + 1])
    }
  } else {
    if (audios[0]?.duration === 0) {
      store.dispatch(
        setCurrentAudio({
          index: audio.index + 1,
          audio: audios[audio.index + 1],
          uri: `${contentUri.CUBBIE_PATH}%2F${
            audios[audio.index + 1]?.fileName
          }`
        })
      )
      playAudio(audio.index + 1, audios[audio.index + 1], audios)
    } else {
      store.dispatch(
        setCurrentAudio({
          index: 0,
          audio: audios[0],
          uri: `${contentUri.CUBBIE_PATH}%2F${audios[0]?.fileName}`
        })
      )
      playAudio(0, audios[0])
    }
  }
}

const playAudio = (index, audioFile) => {
  const { audioTimeoutRefId, audios, volume, isAudioPaused } =
    store.getState().audioControls

  store.dispatch(setRemainingPausedAudioTime(null))
  if (audioTimeoutRefId) {
    clearTimeout(audioTimeoutRefId)
    store.dispatch(setAudioTimeoutRefId(null))
  }
  const audioStartTime = Date.now()
  const audioTimeout = setTimeout(
    () => playNextAudio({ index, audio: audioFile }),
    audioFile?.duration * 1000
  )
  store.dispatch(setAudioStartTime(audioStartTime))
  store.dispatch(setAudioTimeoutRefId(audioTimeout))

  sendMessage(
    JSON.stringify({
      type: 'sessionData',
      category: 'audio',
      audio_id: audioFile?.id,
      audio_volume: volume * 100,
      audio_playing: !isAudioPaused
    })
  )
}

const startPlayList = async message => {
  const audios = message.audios
  if (audios.length > 0) {
    const command = JSON.parse(message.command)

    if (!command.takeControl) {
      store.dispatch(setAudios(audios))
      if (command.args?.volume) {
        const volume = command?.args?.volume / 100
        try {
          const db = database()
          const userRef = db.ref(`${DeviceInfo.getDeviceId()}/startPlayList`)
          userRef.set({ volume })
        } catch (error) {}

        store.dispatch(setVolume(volume))
        await VolumeManager.setVolume(volume)
      }
      store.dispatch(
        setCurrentAudio({
          index: 0,
          audio: audios[0],
          uri: `${contentUri.CUBBIE_PATH}%2F${audios[0].fileName}`
        })
      )

      let zeroDurationAudioCount = 0

      audios.forEach(ele => {
        if (ele.duration === 0) {
          zeroDurationAudioCount += 1
        }
      })

      if (zeroDurationAudioCount === audios.length) {
        playAudio(0, { ...audios[0], duration: message.playlistDuration })
        store.dispatch(setPlaylistDuration(message.playlistDuration))
      } else if (audios.length !== 1 || audios[0].duration !== 0) {
        playAudio(0, audios[0])
      } else {
        playAudio(0, { ...audios[0], duration: message.playlistDuration })
        store.dispatch(setPlaylistDuration(message.playlistDuration))
      }
    } else {
      const { currentAudio, volume, isAudioPaused } =
        store.getState().audioControls

      if (audios.length > 0) {
        store.dispatch(
          setCurrentAudio({
            ...currentAudio,
            audio: audios[0],
            uri: `${contentUri?.CUBBIE_PATH}%2F${audios[0]?.fileName}`
          })
        )
        store.dispatch(setPlaylistDuration(message.playlistDuration))
        sendMessage(
          JSON.stringify({
            type: 'sessionData',
            category: 'audio',
            audio_id: audios[0].id,
            audio_volume: volume * 100,
            audio_playing: !isAudioPaused
          })
        )
      }
    }
  }
}

const stopPlayList = () => {
  const { audioTimeoutRefId } = store.getState().audioControls

  if (audioTimeoutRefId) {
    clearTimeout(audioTimeoutRefId)
    store.dispatch(resetState())
  }

  store.dispatch(setCurrentAudio({ index: 0, audio: null, uri: '' }))
}

const setAudioVolume = async command => {
  if (command?.args?.value !== undefined || command?.args?.value !== null) {
    const { audios, currentAudio, isAudioPaused } =
      store.getState().audioControls
    const volume = command?.args?.value / 100
    try {
      const db = database()
      const userRef = db.ref(`${DeviceInfo.getDeviceId()}/setAudioVolume`)
      userRef.set({ volume })
    } catch (err) {
      // left empty
    }

    store.dispatch(setVolume(volume))
    await VolumeManager.setVolume(volume)

    sendMessage(
      JSON.stringify({
        type: 'sessionData',
        category: 'audio',
        audio_id: currentAudio?.audio?.id,
        audio_volume: command?.args?.value,
        audio_playing: !isAudioPaused
      })
    )
  }
}

const setAudioState = command => {
  const {
    audioTimeoutRefId,
    audios,
    currentAudio,
    audioStartTime,
    volume,
    remainingPausedAudioTime,
    playlistDuration
  } = store.getState().audioControls

  if (command.action === 'pause') {
    const newRemainingPausedAudioTime =
      (remainingPausedAudioTime
        ? remainingPausedAudioTime
        : (audios[currentAudio.index]?.duration
            ? audios[currentAudio.index]?.duration
            : playlistDuration) * 1000) -
      (Date.now() - audioStartTime)

    store.dispatch(setRemainingPausedAudioTime(newRemainingPausedAudioTime))
    clearTimeout(audioTimeoutRefId)
  }

  if (command.action === 'resume' && Math.sign(remainingPausedAudioTime)) {
    const audioStartTime = Date.now()
    const audioTimeout = setTimeout(
      () =>
        playNextAudio({
          index: currentAudio.index,
          audio: audios[currentAudio.index]
        }),
      remainingPausedAudioTime
    )
    store.dispatch(setAudioStartTime(audioStartTime))
    store.dispatch(setAudioTimeoutRefId(audioTimeout))
  }

  sendMessage(
    JSON.stringify({
      type: 'sessionData',
      category: 'audio',
      audio_id: currentAudio?.audio?.id,
      audio_volume: volume * 100,
      audio_playing: !(command.action === 'pause')
    })
  )
  store.dispatch(setAudioPausedState(command.action === 'pause'))
}

const audioService = async message => {
  const command = JSON.parse(message.command)
  if (command.action === 'start_playlist') {
    startPlayList(message)
  }

  if (command.action === 'stop_playlist') {
    stopPlayList()
  }

  if (command.action === 'volume') {
    setAudioVolume(command)
  }

  if (command.action === 'pause' || command.action === 'resume') {
    setAudioState(command)
  }

  const { audioTimeoutRefId } = store.getState()?.audioControls
  if (command.action === 'set_default_state' && !audioTimeoutRefId) {
    const defaultVolume = command.defaultValues.default_volume
      ? command.defaultValues.default_volume / 100
      : 0.6

    try {
      const db = database()
      const userRef = db.ref(`${DeviceInfo.getDeviceId()}/set_default_state`)
      userRef.set({ defaultVolume })
    } catch (err) {}

    store.dispatch(setVolume(defaultVolume))
    await VolumeManager.setVolume(defaultVolume)
  }
}

export default {
  audioService
}
