import DisableButton from './DisableButton.jsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';

export default function DisableСhatButton(props) {
    return (
      <DisableButton {...props}>
            <FontAwesomeIcon icon={faComment} size={"2x"}/>
      </DisableButton>
    );
  }
  