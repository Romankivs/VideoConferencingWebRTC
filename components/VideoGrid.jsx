import { useEffect, useRef } from "react";
import styles from '../css_modules/VideoGrid.module.css'

function Video({stream, id, muted}) {
    const videoRef = useRef();
  
    useEffect(() => {
      videoRef.current.srcObject = stream;
    }, []);
  
    return (
      <video className={styles.video + " col"} ref = {videoRef} id = {id}
      muted = {muted} autoPlay = {true}>
      </video>
    );
  }
  
  export default function VideoGrid({videos}) {
    const listVideos = videos.map((video, i) =>
      <Video key = {video.id} stream = {video.stream} id = {video.id} muted = {video.muted}></Video>
    );  
  
    return (<div className="container-fluid" id="videoGrid"><div className="row min-vh-100 align-items-center no-gutters">{listVideos}</div></div>)
  }