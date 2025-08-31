

import React, { useState, useEffect } from 'react';
import { AgentComponentProps } from '../../types';
import { ImageIcon, XIcon, TrashIcon } from '../../assets/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { storageService } from '../../services/storageService';
import Button from '../shared/Button';

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
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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
        await storageService.deleteItem(storageKey);
        const updatedPhotos = photos.filter((p: any) => p.id !== photoId);
        updateState({ ...instance.state, photos: updatedPhotos });
        setIsConfirmingDelete(false);
        setViewingPhoto(null);
    };

    const requestDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsConfirmingDelete(true);
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsConfirmingDelete(false);
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
                        onClick={cancelDelete}
                    >
                        <motion.div 
                             layoutId={`photo-${viewingPhoto.id}`}
                             className="w-full h-full flex items-center justify-center"
                             onClick={(e) => {
                                 e.stopPropagation();
                                 if (!isConfirmingDelete) setViewingPhoto(null);
                             }}
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
                        
                        <AnimatePresence>
                            {isConfirmingDelete ? (
                                <motion.div 
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center p-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="bg-card p-6 rounded-lg shadow-xl text-card-foreground w-full max-w-sm" onClick={e => e.stopPropagation()}>
                                        <h3 className="font-bold text-lg mb-2">确认删除</h3>
                                        <p className="text-sm text-muted-foreground mb-6">此操作无法撤销。您确定要永久删除这张照片吗？</p>
                                        <div className="flex justify-end space-x-3">
                                            <Button onClick={cancelDelete} variant="secondary">取消</Button>
                                            <Button onClick={() => handleDeletePhoto(viewingPhoto.id, viewingPhoto.storageKey)} className="bg-destructive hover:bg-destructive/90 focus:ring-destructive text-white">确认删除</Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <>
                                    <button onClick={() => setViewingPhoto(null)} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40">
                                        <XIcon className="w-6 h-6" />
                                    </button>
                                    <button 
                                        onClick={requestDelete} 
                                        className="absolute bottom-4 right-4 p-3 bg-destructive/80 rounded-full text-white hover:bg-destructive"
                                        aria-label="删除照片"
                                    >
                                        <TrashIcon className="w-6 h-6" />
                                    </button>
                                </>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PhotosAgent;
