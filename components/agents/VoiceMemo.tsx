import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AgentComponentProps } from '../../types';
import { MicIcon, PlayIcon, TrashIcon, XIcon } from '../../assets/icons';
import { storageService } from '../../services/storageService';
import Button from '../shared/Button';

type RecordingStatus = 'idle' | 'permission_requested' | 'recording' | 'denied' | 'error';
type Recording = {
    id: string;
    name: string;
    storageKey: string;
    duration: number; // in seconds
    createdAt: string;
};

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VoiceMemoAgent: React.FC<AgentComponentProps> = ({ instance, updateState }) => {
    const recordings = (instance.state.recordings || []) as Recording[];
    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [nowPlaying, setNowPlaying] = useState<{ id: string, url: string } | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setStatus('idle');
    }, []);

    const cleanup = useCallback(() => {
        stopRecording();
        if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        mediaRecorderRef.current = null;
    }, [stopRecording]);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const handleStartRecording = async () => {
        if (status === 'recording') return stopRecording();
        
        setStatus('permission_requested');
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64data = reader.result as string;
                    const newId = `rec-${Date.now()}`;
                    const storageKey = `voicememo-${newId}`;
                    await storageService.setItem(storageKey, base64data);

                    const newRecording: Recording = {
                        id: newId,
                        name: `录音 ${recordings.length + 1}`,
                        storageKey,
                        duration: recordingTime,
                        createdAt: new Date().toISOString(),
                    };
                    updateState({ ...instance.state, recordings: [...recordings, newRecording] });
                };
                cleanup();
            };
            
            setRecordingTime(0);
            timerIntervalRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            mediaRecorderRef.current.start();
            setStatus('recording');

        } catch (err) {
            console.error(err);
            setStatus('denied');
            setError('麦克风权限被拒绝。请在浏览器设置中允许访问。');
        }
    };
    
    const handleDeleteRecording = async (id: string, storageKey: string) => {
        await storageService.deleteItem(storageKey);
        const updatedRecordings = recordings.filter(rec => rec.id !== id);
        updateState({ ...instance.state, recordings: updatedRecordings });
        if (nowPlaying?.id === id) setNowPlaying(null);
    };
    
    const handlePlayRecording = async (id: string, storageKey: string) => {
        if (nowPlaying?.id === id && audioRef.current) {
            if (audioRef.current.paused) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
            return;
        }
        const dataUrl = await storageService.getItem<string>(storageKey);
        if (dataUrl) {
            setNowPlaying({ id, url: dataUrl });
        }
    };

    useEffect(() => {
        if(nowPlaying?.url && audioRef.current) {
            audioRef.current.src = nowPlaying.url;
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
    }, [nowPlaying]);

    return (
        <div className="w-full h-full flex flex-col bg-background">
            <div className="flex-grow p-4 overflow-y-auto">
                {recordings.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                        <MicIcon className="w-16 h-16 mb-4" />
                        <p>没有录音</p>
                        <p className="text-sm">点击下方的按钮开始录制您的第一条语音备忘录。</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {recordings.slice().reverse().map(rec => (
                             <li key={rec.id} className="flex items-center p-3 bg-card-glass rounded-lg shadow-sm">
                                <button onClick={() => handlePlayRecording(rec.id, rec.storageKey)} className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                                    <PlayIcon className="w-5 h-5" />
                                </button>
                                <div className="flex-grow mx-4">
                                    <p className="font-semibold text-foreground">{rec.name}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(rec.createdAt).toLocaleString()}</p>
                                </div>
                                <span className="text-sm font-mono text-muted-foreground mr-4">{formatDuration(rec.duration)}</span>
                                <button onClick={() => handleDeleteRecording(rec.id, rec.storageKey)} className="p-2 text-muted-foreground hover:text-destructive">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="flex-shrink-0 p-4 border-t border-border bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="text-center mb-4 h-6">
                    {status === 'recording' && (
                        <p className="text-2xl font-mono text-foreground animate-pulse">{formatDuration(recordingTime)}</p>
                    )}
                     {status === 'denied' && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <button 
                    onClick={handleStartRecording}
                    disabled={status === 'permission_requested'}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${status === 'recording' ? 'bg-destructive' : 'bg-primary'}`}
                >
                   {status === 'recording' ? (
                       <div className="w-8 h-8 bg-white rounded-md"></div>
                   ) : (
                       <MicIcon className="w-10 h-10 text-primary-foreground" />
                   )}
                </button>
            </div>
            <audio ref={audioRef} onEnded={() => setNowPlaying(null)} onPause={() => { /* State can be updated here if needed */ }} className="hidden"/>
        </div>
    );
};

export default VoiceMemoAgent;