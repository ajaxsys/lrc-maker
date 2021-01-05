import { audioStatePubSub, currentTimePubSub } from "../utils/audiomodule.js";
const { useState, useEffect, useRef, useCallback, useMemo } = React;
const AudioWave = ({ duration, paused }) => {
    const self = useRef(Symbol(AudioWave.name));
    const [currentTime, setCurrentTime] = useState(0);
    useEffect(() => {
        let wavePlayer;
        let isPaused = true;
        let currTime = 0;
        let audioTimeDuration = 0;
        const refreshCurrentTime = () => {
            setCurrentTime(Math.round(currTime * 1000) / 1000);
        };
        const statusUnSubscribe = audioStatePubSub.sub(self.current, (data) => {
            console.log(data);
            switch (data.type) {
                case 1:
                    audioTimeDuration = data.payload;
                    break;
                case 4:
                    const WaveSurfer = globalThis.WaveSurfer;
                    const wavesurfer = WaveSurfer.create({
                        container: '#waveform',
                        waveColor: 'violet',
                        progressColor: 'purple',
                    });
                    wavePlayer = wavesurfer;
                    wavesurfer.load(data.payload);
                    wavesurfer.on('seek', ((progress) => {
                        currTime = audioTimeDuration * progress;
                        currentTimePubSub.pub(currTime);
                        if (!isPaused) {
                            console.log("should play...");
                            wavesurfer.play();
                        }
                        else {
                            console.log("Keep paused...");
                        }
                    }));
                    break;
                case 0:
                    if (data.payload === false) {
                        isPaused = false;
                        console.log('currTime', currTime);
                        wavePlayer.setCurrentTime(currTime);
                        wavePlayer.play();
                    }
                    else {
                        isPaused = true;
                        wavePlayer.pause();
                        refreshCurrentTime();
                    }
                    break;
                case 3:
                    wavePlayer.setCurrentTime(data.payload);
                    refreshCurrentTime();
                    if (!isPaused) {
                        wavePlayer.play();
                    }
                    break;
                default:
                    break;
            }
        });
        const timerUnSubscribe = currentTimePubSub.sub(self.current, (currentTime) => {
            currTime = currentTime;
            refreshCurrentTime();
        });
        return () => {
            statusUnSubscribe();
            timerUnSubscribe();
        };
    }, []);
    const ajustTime = (time) => {
        const t = Number(time);
        setCurrentTime(t);
        currentTimePubSub.pub(t);
    };
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { style: { paddingLeft: '0%', marginBottom: '0rem' } },
            React.createElement("span", { style: { color: 'red', cursor: 'pointer', padding: '1.5rem' }, onClick: () => ajustTime(currentTime + 0.1) }, "\uFF0B0.1s \u2191"),
            React.createElement("br", null),
            React.createElement("input", { type: "text", value: currentTime, style: { color: 'red', width: "8rem", height: "3rem", padding: "0.5rem", fontSize: "1.4rem" }, onChange: (e) => {
                    ajustTime(e.target.value);
                } }),
            React.createElement("br", null),
            React.createElement("span", { style: { color: 'blue', cursor: 'pointer', padding: '1.5rem' }, onClick: () => ajustTime(currentTime - 0.1) }, "\u30FC0.1s \u2193")),
        React.createElement("div", { id: "waveform", style: { marginBottom: '1rem' } })));
};
export default AudioWave;
//# sourceMappingURL=audiowave.js.map