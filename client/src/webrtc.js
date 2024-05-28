import { io } from "socket.io-client";
import { effect, signal } from "@preact/signals-react";

const servers = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302"],
        },
    ],
};

export const callObj = signal(null);
export const answerObj = signal(null);

const typeOfCall = signal(null);
const gumAccepted = signal(false);

const pc = signal(null);
const socket = signal(null);

const localStream = signal(null);
const remoteStream = signal(null);

export function call() {
    typeOfCall.value = "call";
}

export function answer() {
    typeOfCall.value = "answer";
}

effect(() => {
    const currentSocket = socket.value
        ? socket.value
        : io("http://localhost:3000");
    socket.value = currentSocket;
    currentSocket.on("call", (data) => {
        callObj.value = data;
    });
    currentSocket.on("answer", (data) => {
        answerObj.value = data;
    });
    currentSocket.on("candidate", (data) => {
        if (pc.value) {
            pc.value.addIceCandidate(data);
        }
    });
});

effect(async () => {
    if (typeOfCall.value) {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        localStream.value = stream;
        gumAccepted.value = true;
    }
});

effect(() => {
    if (gumAccepted.value && !pc.value) {
        pc.value = new RTCPeerConnection(servers);
    }
});

effect(() => {
    if (pc.value && localStream.value) {
        localStream.value
            .getTracks()
            .forEach((track) => pc.value.addTrack(track, localStream.value));
    }
});

effect(async () => {
    if (pc.value && socket.value) {
        if (typeOfCall.value === "call") {
            const offer = await pc.value.createOffer();
            pc.value.setLocalDescription(offer);
            socket.value.emit("call", { sdp: offer });
        }

        if (typeOfCall.value === "answer" && callObj.value) {
            pc.value.setRemoteDescription(callObj.value.sdp);
            const answer = await pc.value.createAnswer();
            pc.value.setLocalDescription(answer);
            socket.value.emit("answer", { sdp: answer });
        }
    }
});

effect(() => {
    if (answerObj.value && pc.value) {
        pc.value.setRemoteDescription(answerObj.value.sdp);
    }
});

effect(() => {
    if (pc.value) {
        pc.value.onicecandidate = (event) => {
            if (event.candidate && socket.value) {
                socket.value.emit("candidate", event.candidate);
            }
        };

        pc.value.ontrack = (event) => {
            if (event.streams[0]) {
                remoteStream.value = event.streams[0];
            }
        };
    }
});

export function setVideos(localVideo, remoteVideo) {
    effect(() => {
        if (localStream.value) {
            localVideo.current.srcObject = localStream.value;
        }
    });

    effect(() => {
        if (remoteStream.value) {
            remoteVideo.current.srcObject = remoteStream.value;
        }
    });
}
