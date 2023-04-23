import { useState } from 'react';
import styles from '../css_modules/ChatPanel.module.css'

function InputMessageTextEditor({ sendMessageCallback }) {
    const [text, setText] = useState("");

    function sendMsg() {
        console.log(`Send button clicked with text: ${text}`);
        sendMessageCallback(text);
        setText("");
    }

    return (
        <div className="input-group px-3 py-5">
            <input
                value={text}
                onChange={e => setText(e.target.value)}
                type="text"
                className="form-control"
                placeholder="Enter message..."
                aria-label="Enter message"
                aria-describedby="basic-addon2"
            />
            <button className="btn btn-primary" type="button" onClick={sendMsg}>
                Send
            </button>
        </div>
    );
}

function ChatMessage({ username, time, message }) {
    return (
    <div className="list-group-item py-3 lh-sm">
        <div className="d-flex w-100 align-items-center justify-content-between">
          <strong className="mb-1">{ username }</strong>
          <small>{ time }</small>
        </div>
        <div className="col-10 mb-1 small">
          { message }
        </div>
      </div>
    );
}

export default function ChatPanel({ messages, sendMessageCallback}) {
    const listMessages = messages.map((msg, i) =>
      <ChatMessage key = {i} username = { msg.username } time = { msg.time } message = { msg.text }/>
    );  

    return (
        <div className="d-flex flex-column bg-white">
        <div className={ styles.chatPanel + " d-flex flex-column align-items-stretch flex-shrink-0 flex-grow-1 bg-white" }>
            <div className="d-flex align-items-center flex-shrink-0 p-3 link-dark text-decoration-none border-bottom">
                <span className="fs-5 fw-semibold">Room chat</span>
            </div>
            <div className="list-group list-group-flush border-bottom scrollarea  overflow-auto ">
                { listMessages }
            </div>
        </div>
        <InputMessageTextEditor sendMessageCallback={sendMessageCallback}/>
        </div>
    );
}