

import React, { useRef, ChangeEvent, useState, useEffect } from 'react';
import { AgentComponentProps } from '../../types';
import { UploadIcon, PlayIcon } from '../../assets/icons';
import { storageService } from '../../services/storageService';

const MediaPlayerAgent: React.FC<AgentComponentProps> = ({ instance, updateState }) => {
    const { storageKey, fileName, fileType } = instance.state;
    const [fileDataURL, setFileDataURL] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let isMounted = true;
        if (storageKey) {
            setIsLoading(true);
            storageService.getItem<string>(storageKey).then(data => {
                if (isMounted) {
                    setFileDataURL(data || null);
                    setIsLoading(false);
                }
            }).catch(error => {
                console.error("Failed to load media from storage:", error);
                if (isMounted) setIsLoading(false);
            });
        } else {
            setFileDataURL(null);
        }
        return () => { isMounted = false; };
    }, [storageKey]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            alert("文件过大！请选择小于50MB的媒体文件。");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target?.result as string;
            const newStorageKey = `media-${Date.now()}-${file.name}`;
            await storageService.setItem(newStorageKey, dataUrl);

            // Clean up old file if it exists
            if (storageKey) {
                await storageService.deleteItem(storageKey);
            }

            updateState({
                ...instance.state,
                storageKey: newStorageKey,
                fileName: file.name,
                fileType: file.type,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleClearMedia = async () => {
        if (storageKey) {
            await storageService.deleteItem(storageKey);
        }
        updateState({ ...instance.state, storageKey: null, fileName: null, fileType: null });
    }
    
    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4 -m-4">
                <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>正在加载媒体...</p>
            </div>
        );
    }


    if (!fileDataURL) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4 bg-secondary/30 rounded-lg -m-4">
                <PlayIcon className="w-16 h-16 mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">媒体播放器</h3>
                <p className="text-sm mb-6">选择一个音频或视频文件进行播放。</p>
                <button
                    onClick={handleUploadClick}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                >
                    <UploadIcon className="w-5 h-5" />
                    选择文件
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="audio/*,video/*"
                    className="hidden"
                />
            </div>
        );
    }
    
    const isVideo = fileType?.startsWith('video/');

    return (
        <div className="w-full h-full flex flex-col items-center justify-center -m-4 p-4 bg-black">
            {isVideo ? (
                <video src={fileDataURL} controls className="max-w-full max-h-[80%]" />
            ) : (
                <audio src={fileDataURL} controls className="w-full max-w-md" />
            )}
            <div className="mt-4 text-center">
                <p className="text-white text-sm truncate max-w-xs">{fileName}</p>
                 <button onClick={handleClearMedia} className="mt-2 text-xs text-blue-300 hover:underline">
                    选择其他文件
                </button>
            </div>
        </div>
    );
};

export default MediaPlayerAgent;