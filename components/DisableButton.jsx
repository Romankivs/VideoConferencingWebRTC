import { useState } from 'react';
import styles from '../css_modules/DisableButton.module.css'

export default function DisableButton({onChange, children}) {
    const [disabled, setDisabled] = useState(false);
  
    function toggle() {
      setDisabled(!disabled);
      onChange(disabled);
    }
  
    return (
      <button onClick={toggle}
      className={styles.disableButton}
      style={{backgroundColor: disabled  ? '#A52A2A' : '#F0F8FF'}}>
        {children}
      </button>
    );
  }
  