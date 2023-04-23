import { useState } from 'react';
import styles from '../css_modules/DisableButton.module.css'

export default function DisableButton({onChange, children}) {
    const [disabled, setDisabled] = useState(false);
  
    function toggle() {
      setDisabled(!disabled);
      onChange(disabled);
    }
  
    const add = disabled ? " bg-danger" : " bg-light"
    return (
      <button onClick={toggle}
      className={styles.disableButton + " border-primary" + add}>
        {children}
      </button>
    );
  }
  