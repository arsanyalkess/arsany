
import React, { useRef } from 'react';
import { ImageData } from '../types';
import { translations } from '../translations';

interface ImageUploaderProps {
  imageData: ImageData;
  onUpload: (file: File) => void;
  onClear: () => void;
  label?: string;
  lang?: 'en' | 'ar';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ imageData, onUpload, onClear, label, lang = 'en' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-white/5">
      <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">
        {label || t.uploadRef}
      </label>
      
      {!imageData.previewUrl ? (
        <div 
          onClick={() => inputRef.current?.click()}
          className="group cursor-pointer border-2 border-dashed border-white/10 hover:border-white/30 p-10 flex flex-col items-center justify-center transition-colors"
        >
          <i className="fa-solid fa-cloud-arrow-up text-2xl text-gray-600 group-hover:text-white transition-colors mb-4"></i>
          <p className="text-xs uppercase tracking-widest text-gray-600 group-hover:text-gray-400">{t.uploadRef}</p>
          <input 
            type="file" 
            ref={inputRef} 
            onChange={handleChange} 
            className="hidden" 
            accept="image/*" 
          />
        </div>
      ) : (
        <div className="relative group">
          <img 
            src={imageData.previewUrl} 
            className={`w-full h-64 object-cover border border-white/10 transition-all duration-700 ${imageData.isAnalyzing ? 'blur-sm grayscale' : 'grayscale hover:grayscale-0'}`}
            alt="Reference"
          />
          
          {imageData.isAnalyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="text-[10px] uppercase tracking-widest text-white">{lang === 'ar' ? 'جاري التحليل...' : 'Analyzing Asset...'}</p>
            </div>
          )}

          {!imageData.isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button 
                onClick={() => inputRef.current?.click()}
                className="bg-white text-black text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-gray-200"
              >
                {t.change}
              </button>
              <button 
                onClick={onClear}
                className="bg-red-900 text-white text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-red-800"
              >
                {t.remove}
              </button>
            </div>
          )}
          <input 
            type="file" 
            ref={inputRef} 
            onChange={handleChange} 
            className="hidden" 
            accept="image/*" 
          />
        </div>
      )}
      
      {imageData.analysisText && !imageData.isAnalyzing && (
        <div className="mt-3 p-3 bg-white/5 border border-white/10">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 italic opacity-60">AI Analysis Injected</p>
          <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{imageData.analysisText}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
