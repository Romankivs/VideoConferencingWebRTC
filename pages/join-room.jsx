import styles from '../css_modules/JoinRoom.module.css'

function JoinRoom( { roomId }) {
    return (
        <div className={ styles.main }>
        <main className="form-signin w-100 m-auto text-center">
            <form method="POST">
                <h1 className="h3 mb-3 fw-normal">Join Room</h1>
                <div className="form-floating mb-4">
                <input
                    name="username"
                    type="username"
                    className="form-control"
                    id="username"
                    placeholder=""
                />
                <label htmlFor="username">Username</label>
                </div>
                <div className="form-floating mb-4">
                <input
                    name="roomId"
                    type="roomId"
                    className="form-control"
                    id="roomId"
                    placeholder=""
                    value = {roomId}
                />
                <label htmlFor="roomId">Room Id</label>
                </div>
                <button className="w-50 btn btn-lg btn-primary submit" type="submit">
                    Join
                </button>
            </form>
        </main>
        </div>
    );
}

JoinRoom.getInitialProps = async (ctx) => {
    ctx.res.clearCookie('roomId');
    return { roomId: ctx.req.signedCookies['roomId']};
}

export default JoinRoom;