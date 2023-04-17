import DisableButton from './DisableButton.jsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';

export default function MuteMicrophoneButton(props) {
    return (
        <DisableButton {...props}>
            <FontAwesomeIcon icon={faMicrophone} size={"2x"}/>
        </DisableButton>
    );
}