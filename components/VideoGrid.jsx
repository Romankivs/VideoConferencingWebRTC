import { useEffect, useRef } from "react";
import styles from '../css_modules/VideoGrid.module.css'

function Video({stream, id, username, muted, maxHeight}) {
    const videoRef = useRef();
  
    useEffect(() => {
      videoRef.current.srcObject = stream;
    }, []);

    return (
      <div className={styles.videoMask + " border border-primary bg-secondary rounded"}>
        <video className={styles.video} ref = {videoRef} id = {id}
        muted = {muted} autoPlay = {true} style={{maxHeight: maxHeight}}>
        </video>
        <div className={styles.usernameContainer}>
          <h5 className = {styles.username + " font-weight-normal text-white"}>{username}</h5>
        </div>
      </div>
    );
}

export default function VideoGrid({videos}) {
  const numberOfColumns = Math.ceil(Math.sqrt(videos.length));
  const numberOfRows = Math.ceil(videos.length / numberOfColumns);

  const heightPerRow = numberOfRows > 0 ? Math.ceil(100 / numberOfRows) : 0;

  const listVideos = videos.map((video, i) =>
    <Video key = {video.id} stream = {video.stream} id = {video.id} username = {video.username} muted = {video.muted} maxHeight={ heightPerRow + "vh"}></Video>
  );  

  return (<div className={styles.videoGrid + " "} style={{ gridTemplateRows: "repeat(" + numberOfRows + ", 1fr)",
    gridTemplateColumns: "repeat(" + numberOfColumns + ", 1fr)"}}>{listVideos}</div>)
}