import styles from '../css_modules/ChatPanel.module.css'

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

export default function ChatPanel() {
    return (
        <div className={styles.chatPanel + " d-flex flex-column align-items-stretch flex-shrink-0 bg-white"}>
            <div className="d-flex align-items-center flex-shrink-0 p-3 link-dark text-decoration-none border-bottom">
                <span className="fs-5 fw-semibold">Room chat</span>
            </div>
            <div className="list-group list-group-flush border-bottom scrollarea  overflow-auto ">
                <ChatMessage username="John Doe" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message.Example message.Example message.Example message.Example message.Example message.Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="Sviatoslav Romankiv" time="11:30" message="Example message." />
                <ChatMessage username="John Doe" time="11:30" message="Example message." />
            </div>
        </div>
    );
}