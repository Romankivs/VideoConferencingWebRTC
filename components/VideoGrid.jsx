import { useEffect, useRef } from "react";
import styles from '../css_modules/VideoGrid.module.css'

function Video({stream, id, username, muted}) {
    const videoRef = useRef();
  
    useEffect(() => {
      videoRef.current.srcObject = stream;
    }, []);
  
    return (
      <div className={styles.videoMask + " col m-2 border border-primary bg-secondary rounded"}>
        <video className={styles.video} ref = {videoRef} id = {id}
        muted = {muted} autoPlay = {true}>
        </video>
        <div className={styles.usernameContainer}>
          <h5 className = {styles.username + " font-weight-normal text-white"}>{username}</h5>
        </div>
      </div>
    );
}

export default function VideoGrid({videos}) {
  const listVideos = videos.map((video, i) =>
    <Video key = {video.id} stream = {video.stream} id = {video.id} username = {video.username} muted = {video.muted}></Video>
  );  

  return (<div className="container-fluid  p-5" id="videoGrid"><div className="row h-100">{listVideos}</div></div>)
}