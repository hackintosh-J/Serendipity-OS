
import React, { useRef, useEffect, useState } from 'react';
import { AgentComponentProps } from '../../types';
import Button from '../shared/Button';
import { storageService } from '../../services/storageService';


const CameraAgent: React.FC<AgentComponentProps> = ({ close, dispatch, osState }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        // If we have an image, we don't need the camera stream.
        // The cleanup function from the previous render will have already stopped the stream.
        if (capturedImage) {
            return;
        }

        let stream: MediaStream | null = null;
        let isCancelled = false;

        const startCamera = async () => {
            setError(null);
            setIsCameraReady(false);
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("您的浏览器不支持相机功能。");
                }
                
                const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });

                if (permissionStatus.state === 'denied') {
                    throw new Error("相机权限已被禁用。请在浏览器或系统设置中启用它。");
                }

                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                
                if (isCancelled) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    return;
                }

                stream = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
                    setError("相机访问被拒绝。请授予权限以使用此功能。");
                } else if (err instanceof Error) {
                     setError(err.message);
                } else {
                    setError("无法访问相机。请检查设备和权限设置。");
                }
            }
        };
        
        startCamera();

        // This cleanup function will be called when the component unmounts
        // or when `capturedImage` changes, stopping the camera stream.
        return () => {
            isCancelled = true;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            setIsCameraReady(false);
        };
    }, [capturedImage]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current && isCameraReady) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                setError("相机数据尚未准备好，请稍后再试。");
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl); // This triggers the useEffect cleanup to stop the camera
            }
        }
    };
    
    const handleRetake = () => {
        setCapturedImage(null); // This will trigger the useEffect to restart the camera.
    };

    const handleSave = async () => {
        if (capturedImage && osState) {
            const photoAlbums = Object.values(osState.activeAssets).filter(
                asset => asset.agentId === 'agent.system.photos'
            );

            const photoId = `photo-${Date.now().toString(36)}`;
            const storageKey = `media-${photoId}`;

            await storageService.setItem(storageKey, capturedImage);

            const newPhoto = {
                id: photoId,
                storageKey: storageKey,
                createdAt: new Date().toISOString()
            };

            if (photoAlbums.length > 0) {
                const album = photoAlbums[0];
                const updatedPhotos = [...(album.state.photos || []), newPhoto];
                dispatch({
                    type: 'UPDATE_ASSET_STATE',
                    payload: { assetId: album.id, newState: { ...album.state, photos: updatedPhotos } }
                });
                alert('照片已保存到您的相册！');
            } else {
                dispatch({
                    type: 'CREATE_ASSET',
                    payload: {
                        agentId: 'agent.system.photos',
                        name: '我的相册',
                        initialState: { photos: [newPhoto] }
                    }
                });
                alert('已为您创建新相册并保存照片！');
            }
            close();
        }
    };
    
    const handleCanPlay = () => {
        if (videoRef.current?.srcObject) {
            setIsCameraReady(true);
            videoRef.current?.play().catch(e => console.error("Video play failed:", e));
        }
    };

    if (error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-destructive text-center p-4 bg-background">
                <p>{error}</p>
                {(error.includes("权限") || error.includes("denied")) && (
                     <Button onClick={handleRetake} variant="secondary" className="mt-4">重试</Button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black">
            <div className="relative w-full h-full">
                {capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                ) : (
                    <>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            onCanPlay={handleCanPlay}
                            className="w-full h-full object-cover" 
                        />
                        {!isCameraReady && !error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="ml-3">正在启动相机...</span>
                            </div>
                        )}
                    </>
                )}
                 <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-center">
                 {capturedImage ? (
                    <div className="flex space-x-4">
                        <Button onClick={handleRetake} variant="secondary">重拍</Button>
                        <Button onClick={handleSave}>保存到相册</Button>
                    </div>
                ) : (
                    <button 
                        onClick={handleCapture}
                        disabled={!isCameraReady}
                        className="w-20 h-20 rounded-full bg-white/90 border-4 border-black/50 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-400/50 disabled:cursor-not-allowed"
                        aria-label="拍照"
                    ></button>
                )}
            </div>
        </div>
    );
};

export default CameraAgent;