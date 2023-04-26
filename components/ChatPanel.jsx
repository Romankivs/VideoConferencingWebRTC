import { useState } from 'react';
import styles from '../css_modules/ChatPanel.module.css'

function InputMessageTextEditor({ sendMessageCallback }) {
    const [text, setText] = useState("");

    function sendMsg() {
        console.log(`Send button clicked with text: ${text}`);
        if (text !== "") {
            sendMessageCallback(text);
            setText("");
        }
    }

    return (
        <div className="input-group px-3 py-5 border-top">
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

function ChatMessage({ username, time, message, fromYourself }) {
    const usernameColour = fromYourself ? "text-primary" : "";
    return (
        <div class="list-group-item py-3 lh-sm">
        <div class="d-flex w-100 align-items-center justify-content-between">
          <strong class={usernameColour + " mb-1"}>{username}</strong>
          <small>{time}</small>
        </div>
        <div class="col-10 mb-1 small " style={{whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}>{message}</div>
      </div>
    );
}

export default function ChatPanel({ messages, sendMessageCallback}) {
    const listMessages = messages.map((msg, i) =>
      <ChatMessage key = {i} username = { msg.username } time = { msg.time } message = { msg.text } fromYourself={ msg.fromYourself }/>
    );  

    return (
        <div className="d-flex flex-column bg-white border-start border-primary w-20 flex-shrink-1" style={{ minWidth: "100px", maxWidth: "20%", maxHeight: "100vh" }}>
        <div className="d-flex flex-column align-items-stretch flex-shrink-0 flex-grow-1 bg-white"  style={{ maxHeight: "80vh"}}>
            <div className="d-flex align-items-center flex-shrink-0 p-3 link-dark text-decoration-none border-bottom min-vh-15">
                <span className="fs-5 fw-semibold">Room chat</span>
            </div>
            <div className="list-group list-group-flush border-bottom scrollarea overflow-auto">
                { listMessages }
            </div>
        </div>
        <InputMessageTextEditor sendMessageCallback={sendMessageCallback}/>
        </div>
    );
}