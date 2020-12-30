import { convertTimeToTag } from "../lrc-parser.js";
import { AudioActionType, audioRef, AudioState, audioStatePubSub, currentTimePubSub } from "../utils/audiomodule.js";
import { loadAudioDialogRef } from "./loadaudio.js";
import { Forward5sSVG, LoadAudioSVG, PauseSVG, PlaySVG, Replay5sSVG } from "./svg.js";
// import {CopyToClipboard} from 'react-copy-to-clipboard';

const { useState, useEffect, useRef, useCallback, useMemo } = React;

const AudioWave: React.FC<{ duration: number; paused: boolean }> = ({ duration, paused }) => {
    const self = useRef(Symbol(AudioWave.name));
    const [currentTime, setCurrentTime] = useState(0);

    const inputTime = () => {
        alert('请按空格打轴');
    }

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
                        console.log(progress);
                        currTime = audioTimeDuration * progress;
                        // refreshCurrentTime();
                        currentTimePubSub.pub(currTime); // 通知隐藏的那个audio，时间被拖动了
                        
                        if (!paused) {
                            wavesurfer.play(); // 防止停止
                        //     audioStatePubSub.pub({type: AudioActionType.pause, payload: true}); // 通知隐藏的那个audio已被暂停
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

    return (
        <>
            {
                currentTime ?
                <div style={{paddingLeft: '10%', marginBottom: '1rem'}}>
                    <input value={currentTime} style={{color: 'blue', width: "6rem"}}
                        onClick={(e) => e.currentTarget.select()}>
                        {/* 
                        <CopyToClipboard text={'' + currentTime}
                            onCopy={() => console.log({copied: true})}>
                            <span>Copy</span>
                        </CopyToClipboard> 
                        */}
                    </input>
                    <button style={{color: "white", cursor: "pointer"}} onClick={inputTime}>录入</button>
                </div>
                :
                null 
            }
            <div id="waveform" style={{marginBottom: '2rem'}}>
            </div>
        </>
    );
};


export default AudioWave;