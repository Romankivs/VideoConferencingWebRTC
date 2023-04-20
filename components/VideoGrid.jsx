import { useEffect, useRef } from "react";

function Video({stream, id, muted}) {
    const videoRef = useRef();
  
    useEffect(() => {
      videoRef.current.srcObject = stream;
    }, []);
  
    return (
      <video className="col" ref = {videoRef} id = {id}
      muted = {muted} autoPlay = {true}>
      </video>
    );
  }
  
  export default function VideoGrid({videos}) {
    const listVideos = videos.map((video, i) =>
      <Video key = {video.id} stream = {video.stream} id = {video.id} muted = {video.muted}></Video>
    );  
  
    return (<div className="container-fluid min-vh-100" id="videoGrid"><div className="row min-vh-100 align-items-center no-gutters">{listVideos}</div></div>)
  }