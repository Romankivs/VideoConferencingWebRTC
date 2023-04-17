import DisableButton from './DisableButton.jsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';

export default function DisableCameraButton(props) {
  return (
    <DisableButton {...props}>
          <FontAwesomeIcon icon={faCamera} size={"2x"}/>
    </DisableButton>
  );
}