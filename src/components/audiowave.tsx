import { convertTimeToTag } from "../lrc-parser.js";
import { AudioActionType, audioRef, AudioState, audioStatePubSub, currentTimePubSub } from "../utils/audiomodule.js";
import { loadAudioDialogRef } from "./loadaudio.js";
import { Forward5sSVG, LoadAudioSVG, PauseSVG, PlaySVG, Replay5sSVG } from "./svg.js";
// import {CopyToClipboard} from 'react-copy-to-clipboard';

const { useState, useEffect, useRef, useCallback, useMemo } = React;

const AudioWave: React.FC<{ duration: number; paused: boolean }> = ({ duration, paused }) => {
    const self = useRef(Symbol(AudioWave.name));
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {

        let wavePlayer: any;
        let isPaused = true;
        let currTime = 0;
        let audioTimeDuration = 0;

        const refreshCurrentTime = () => {
            setCurrentTime(Math.round(currTime * 1000) / 1000)
        }

        const statusUnSubscribe = audioStatePubSub.sub(self.current, (data) => {
            console.log(data);

            // https://wavesurfer-js.org/doc/class/src/wavesurfer.js~WaveSurfer.html
            // 裏のHTML API? :
            // https://wavesurfer-js.org/doc/class/src/webaudio.js~WebAudio.html
            switch (data.type) {
                case AudioActionType.getDuration:
                    // 获取音频长度
                    audioTimeDuration = data.payload;
                    break;
                case AudioActionType.audioReady:
                    // 文件准备OK
                    const WaveSurfer = (globalThis as any).WaveSurfer;
                    // const TimelinePlugin = WaveSurfer.TimelinePlugin;
                    // const MinimapPlugin = WaveSurfer.MinimapPlugin;
        
                    const wavesurfer = WaveSurfer.create({
                        container: '#waveform',
                        waveColor: 'violet',
                        progressColor: 'purple',
                        // plugins: [
                        //     TimelinePlugin.create({
                        //         container: '#wave-timeline'
                        //     }),
                        //     MinimapPlugin.create()
                        // ]
                    });

                    wavePlayer = wavesurfer;

                    // DOC: on/un events 
                    // https://wavesurfer-js.org/docs/events.html
                    // & API
                    // https://wavesurfer-js.org/docs/methods.html
                    wavesurfer.load(data.payload);
                    // console.log(wavesurfer);

                    // 当波形图被点击调整位置时候
                    wavesurfer.on('seek', ((progress: any) => {
                        // console.log(progress);
                        currTime = audioTimeDuration * progress;
                        // refreshCurrentTime();
                        currentTimePubSub.pub(currTime); // 通知隐藏的那个audio，时间被拖动了
                        
                        if (!isPaused) {
                            console.log("should play...")
                            wavesurfer.play(); // 防止停止
                        //     audioStatePubSub.pub({type: AudioActionType.pause, payload: true}); // 通知隐藏的那个audio已被暂停
                        } else {
                            console.log("Keep paused...")
                        }
                    }));

                    break;
            
                case AudioActionType.pause:
                    if (data.payload === false) {
        
                        // 播放
                        isPaused = false;
                        console.log('currTime', currTime)
                        wavePlayer.setCurrentTime(currTime);
                        wavePlayer.play();
                        // wavesurfer.on('ready', function () {
                        //     wavesurfer.play(); // 无需等待ready
                        // });
                    } else {
        
                        // 暂停
                        isPaused = true;
                        wavePlayer.pause();
                        refreshCurrentTime();
                    }
        
                    break;
                case AudioActionType.timeChange:
                    // seek
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
            // console.log(currentTime);
            currTime = currentTime;
            refreshCurrentTime();
        });

        return () => {
            statusUnSubscribe();
            timerUnSubscribe();
        }

    }, []);

    const ajustTime = (time: number | string) => {
        // 支持手动微调时间
        const t = Number(time);
        setCurrentTime(t);
        currentTimePubSub.pub(t);
    }

    return (
        <>
            
                <div style={{paddingLeft: '0%', marginBottom: '0rem'}}>
                    <span style={{color: 'red', cursor: 'pointer', padding: '0 1.5rem'}}
                        onClick={() => ajustTime(currentTime + 0.1)}>＋0.1s ↑</span>
                    <br />
                    <input type="text" value={currentTime} style={{color: 'red', width: "8rem", height: "3rem", padding: "0.5rem", fontSize: "1.4rem"}}
                        onChange={(e) => {
                            ajustTime(e.target.value);
                        }} 
                        // onClick={(e) => e.currentTarget.select()}>
                        >
                        {/* 
                        <CopyToClipboard text={'' + currentTime}
                            onCopy={() => console.log({copied: true})}>
                            <span>Copy</span>
                        </CopyToClipboard> 
                        */}
                    </input>
                    <br />
                    <span style={{color: 'blue', cursor: 'pointer', padding: '0 1.5rem'}}
                        onClick={() => ajustTime(currentTime - 0.1)}>ー0.1s ↓</span>

                </div>
            
            <div id="waveform" style={{marginBottom: '1rem'}}>
            </div>
        </>
    );
};


export default AudioWave;