import { useEffect, useRef } from "react";

function Video({stream, id, muted}) {
    const videoRef = useRef();
  
    useEffect(() => {
      videoRef.current.srcObject = stream;
    }, []);
  
    return (
      <video ref = {videoRef} id = {id} width = {640} height = {360}
      muted = {muted} autoPlay = {true}>
      </video>
    );
  }
  
  export default function VideoGrid({videos}) {
    const listVideos = videos.map((video, i) =>
      <Video key = {video.id} stream = {video.stream} id = {video.id} muted = {video.muted}></Video>
    );  
  
    return (<div className="videoGrid" id="videoGrid">{listVideos}</div>)
  }