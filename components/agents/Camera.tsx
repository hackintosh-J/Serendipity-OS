

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AgentComponentProps } from '../../types';
import Button from '../shared/Button';
import { storageService } from '../../services/storageService';


const CameraAgent: React.FC<AgentComponentProps> = ({ close, dispatch, osState }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError("您的浏览器不支持相机功能。");
                return;
            }
            
            // Check permission status first to provide better feedback
            const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });

            if (permissionStatus.state === 'denied') {
                setError("相机权限已被禁用。请在浏览器或系统设置中启用它。");
                return;
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null); // Clear previous errors
        } catch (err) {
            console.error("Error accessing camera:", err);
            if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
                setError("相机访问被拒绝。请授予权限以使用此功能。");
            } else {
                setError("无法访问相机。请检查设备和权限设置。");
            }
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        if (!capturedImage) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [capturedImage, startCamera, stopCamera]);
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };
    
    const handleRetake = () => {
        setCapturedImage(null);
        // The useEffect will call startCamera()
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
                // Add to the first existing album
                const album = photoAlbums[0];
                const updatedPhotos = [...(album.state.photos || []), newPhoto];
                dispatch({
                    type: 'UPDATE_ASSET_STATE',
                    payload: { assetId: album.id, newState: { ...album.state, photos: updatedPhotos } }
                });
                alert('照片已保存到您的相册！');
            } else {
                // Create a new album with this photo
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

    if (error) {
        return <div className="w-full h-full flex items-center justify-center text-destructive text-center p-4 -m-4 bg-background">{error}</div>;
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center -m-4 bg-black">
            <div className="relative w-full h-full">
                {capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                ) : (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
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
                    <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white/90 border-4 border-black/50 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"></button>
                )}
            </div>
        </div>
    );
};

export default CameraAgent;
