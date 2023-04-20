import MuteMicrophoneButton from './MuteMicrophoneButton.jsx'
import DisableCameraButton from './DisableCameraButton.jsx';
import DisableСhatButton from './DisableChatButton.jsx';
import styles from '../css_modules/FloatingBottomRow.module.css'

export default function FloatingBottomRow({ toggleMute, toggleCamera, toggleChat }) {
    return (
        <div className={ styles.floatingBottomRow }>
            <MuteMicrophoneButton onChange={toggleMute}/>
            <DisableCameraButton onChange={toggleCamera} />
            <DisableСhatButton onChange={toggleChat}/>
        </div>        
    );
}