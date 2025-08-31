

import React, { useState, useEffect } from 'react';
import { AgentComponentProps } from '../../types';
import { ImageIcon, XIcon, TrashIcon } from '../../assets/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { storageService } from '../../services/storageService';

interface Photo {
    id: string;
    storageKey: string;
    createdAt: string;
}

const PhotoThumbnail: React.FC<{ photo: Photo, onClick: () => void }> = ({ photo, onClick }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        storageService.getItem<string>(photo.storageKey)
            .then(dataUrl => {
                if (isMounted && dataUrl) {
                    setImageUrl(dataUrl);
                }
            })
            .catch(err => console.error("Failed to load thumbnail", err));
        
        return () => { isMounted = false; };
    }, [photo.storageKey]);

    return (
        <motion.div
            layoutId={`photo-${photo.id}`}
            onClick={onClick}
            className="aspect-square bg-secondary rounded-lg overflow-hidden cursor-pointer group relative animate-pulse"
            style={{ animationDuration: '1.5s' }}
            whileHover={{ scale: 1.05 }}
        >
            {imageUrl && (
                 <img src={imageUrl} alt={`Photo taken at ${photo.createdAt}`} className="w-full h-full object-cover" />
            )}
        </motion.div>
    );
};


const PhotosAgent: React.FC<AgentComponentProps> = ({ instance, updateState }) => {
    const { photos = [] } = instance.state;
    const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
    const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        if (viewingPhoto?.storageKey) {
            storageService.getItem<string>(viewingPhoto.storageKey)
                .then(dataUrl => {
                    if (isMounted && dataUrl) {
                        setFullImageUrl(dataUrl);
                    }
                })
                .catch(err => console.error("Failed to load full image", err));
        } else {
            setFullImageUrl(null);
        }
        return () => { isMounted = false; };
    }, [viewingPhoto]);

    const handleDeletePhoto = async (photoId: string, storageKey: string) => {
        if(window.confirm("您确定要删除这张照片吗？")) {
            await storageService.deleteItem(storageKey);
            const updatedPhotos = photos.filter((p: any) => p.id !== photoId);
            updateState({ ...instance.state, photos: updatedPhotos });
            if (viewingPhoto?.id === photoId) {
                setViewingPhoto(null);
            }
        }
    };

    return (
        <div className="w-full h-full flex flex-col -m-4 bg-background">
            {photos.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                    <ImageIcon className="w-16 h-16 mb-4" />
                    <p>相册为空。</p>
                    <p className="text-sm">使用 AI相机 拍摄一些照片吧！</p>
                </div>
            ) : (
                <div className="flex-grow p-4 overflow-y-auto">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {photos.slice().reverse().map((photo: Photo) => (
                            <PhotoThumbnail
                                key={photo.id}
                                photo={photo}
                                onClick={() => setViewingPhoto(photo)}
                            />
                        ))}
                    </div>
                </div>
            )}
            <AnimatePresence>
                {viewingPhoto && (
                    <motion.div 
                        className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewingPhoto(null)}
                    >
                        <motion.div 
                             layoutId={`photo-${viewingPhoto.id}`}
                             className="w-full h-full flex items-center justify-center"
                        >
                        {fullImageUrl ? (
                            <img 
                                src={fullImageUrl} 
                                className="max-w-[90vw] max-h-[80vh] object-contain"
                                onClick={e => e.stopPropagation()}
                                alt=""
                            />
                        ) : (
                             <div className="w-24 h-24 text-white">
                                <svg className="animate-spin h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                        </motion.div>
                        <button onClick={() => setViewingPhoto(null)} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40">
                            <XIcon className="w-6 h-6" />
                        </button>
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(viewingPhoto.id, viewingPhoto.storageKey);
                            }} 
                            className="absolute bottom-4 right-4 p-3 bg-destructive/80 rounded-full text-white hover:bg-destructive"
                            aria-label="删除照片"
                        >
                            <TrashIcon className="w-6 h-6" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PhotosAgent;