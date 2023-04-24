import { useEffect, useRef } from "react";
import styles from '../css_modules/VideoGrid.module.css'

function Video({stream, id, muted}) {
    const videoRef = useRef();
  
    useEffect(() => {
      videoRef.current.srcObject = stream;
    }, []);
  
    return (
      <div className="col m-5 border border-primary bg-secondary rounded">
        <video className={styles.video} ref = {videoRef} id = {id}
        muted = {muted} autoPlay = {true}>
        </video>
      </div>
    );
  }
  
  export default function VideoGrid({videos}) {
    const listVideos = videos.map((video, i) =>
      <Video key = {video.id} stream = {video.stream} id = {video.id} muted = {video.muted}></Video>
    );  
  
    return (<div className="container-fluid" id="videoGrid"><div className="row h-100">{listVideos}</div></div>)
  }