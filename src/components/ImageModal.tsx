import { X, Heart, Download, ExternalLink, User } from 'lucide-react';
import type { PexelsPhoto } from '../types/pexels';

interface ImageModalProps {
  photo: PexelsPhoto;
  onClose: () => void;
  onToggleFavorite: (photo: PexelsPhoto) => void;
  isFavorite: boolean;
}

export function ImageModal({ photo, onClose, onToggleFavorite, isFavorite }: ImageModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-2 xs:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-2 xs:top-4 right-2 xs:right-4 p-2 xs:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:rotate-90"
      >
        <X className="w-5 h-5 xs:w-6 xs:h-6" />
      </button>

      <div
        className="max-w-6xl w-full max-h-[95vh] xs:max-h-[90vh] overflow-auto bg-zinc-900 rounded-lg xs:rounded-2xl shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img
            src={photo.src.large2x}
            alt={photo.alt}
            className="w-full h-auto max-h-[60vh] xs:max-h-[70vh] object-contain"
          />
          <div
            className="absolute top-2 xs:top-4 left-2 xs:left-4 px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-xs font-medium backdrop-blur-md"
            style={{ backgroundColor: `${photo.avg_color}40` }}
          >
            {photo.width} × {photo.height}
          </div>
        </div>

        <div className="p-3 xs:p-4 sm:p-6 space-y-3 xs:space-y-4">
          <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 xs:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg xs:text-2xl font-bold text-white mb-1 xs:mb-2 line-clamp-2">
                {photo.alt || 'Untitled'}
              </h2>
              <a
                href={photo.photographer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 xs:gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200 text-sm xs:text-base"
              >
                <User className="w-4 h-4" />
                <span className="font-medium truncate">{photo.photographer}</span>
              </a>
            </div>

            <div className="flex items-center gap-1 xs:gap-2 flex-shrink-0">
              <button
                onClick={() => onToggleFavorite(photo)}
                className={`p-2 xs:p-3 rounded-full transition-all duration-200 ${
                  isFavorite
                    ? 'bg-rose-500 text-white scale-110'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Heart className={`w-4 h-4 xs:w-5 xs:h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <a
                href={photo.src.original}
                download
                className="p-2 xs:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
              >
                <Download className="w-4 h-4 xs:w-5 xs:h-5" />
              </a>
              <a
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 xs:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
              >
                <ExternalLink className="w-4 h-4 xs:w-5 xs:h-5" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="px-3 xs:px-4 py-1.5 xs:py-2 rounded-full bg-white/5 text-white/70 text-xs xs:text-sm">
              ID: {photo.id}
            </div>
            <div
              className="px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-white text-xs xs:text-sm font-medium"
              style={{ backgroundColor: photo.avg_color }}
            >
              {photo.avg_color}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
