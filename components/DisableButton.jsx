import { useState } from 'react';

export default function DisableButton({onChange, children}) {
    const [disabled, setDisabled] = useState(false);
  
    function toggle() {
      setDisabled(!disabled);
      onChange(disabled);
    }
  
    return (
      <button onClick={toggle}
      className={"actionButton"}
      style={{backgroundColor: disabled  ? '#A52A2A' : '#F0F8FF'}}>
        {children}
      </button>
    );
  }
  