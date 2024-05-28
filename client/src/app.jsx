import { useRef } from "react";
import { answer, call, callObj, setVideos } from "./webrtc";

export function App() {
    const localVideo = useRef(null);
    const remoteVideo = useRef(null);

    setVideos(localVideo, remoteVideo);

    return (
        <main>
            <button onClick={call}>call</button>
            {callObj.value && <button onClick={answer}>answer</button>}

            <video ref={localVideo} muted autoPlay />
            <video ref={remoteVideo} muted autoPlay />
        </main>
    );
}
