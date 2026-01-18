
import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
    currentImage?: string | null;
    onImageUploaded: (url: string) => void;
    label?: string;
    className?: string;
}

export default function ImageUpload({ currentImage, onImageUploaded, label = "Profile Photo", className = "" }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Local Preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:8000/upload/', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            onImageUploaded(data.url);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. Please try again.");
            setPreview(currentImage || null); // Revert
        } finally {
            setIsUploading(false);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onImageUploaded(""); // Or keep valid URL depending on requirement? For now empty string usually means remove. 
        // Ideally backend handles empty string as "remove" or keep old? 
        // Actually, if we pass empty string to API, does it remove it?
        // API updates field if not None. Empty string is not None. So it might set to "".
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="text-sm font-medium text-neutral-400">{label}</label>
            <div
                onClick={triggerUpload}
                className="relative group w-32 h-32 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-600 hover:border-green-500 overflow-hidden cursor-pointer transition-all flex items-center justify-center"
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                            </div>
                        )}
                        <button
                            onClick={clearImage}
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove Photo"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1 text-neutral-500 group-hover:text-green-500 transition-colors">
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                            <>
                                <Upload className="w-8 h-8" />
                                <span className="text-xs font-medium">Upload</span>
                            </>
                        )}
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>
        </div>
    );
}
