// state - rootReducer
import { combineReducers } from 'redux';
import videoControls from './videoControls';
import audioControls from './audioControls';

const rootReducer = combineReducers({
    videoControls,
    audioControls
});

export default rootReducer;
