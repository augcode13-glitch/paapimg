import { Heart, Download, ExternalLink } from 'lucide-react';
import type { PexelsPhoto } from '../types/pexels';

interface ImageCardProps {
  photo: PexelsPhoto;
  onImageClick: (photo: PexelsPhoto) => void;
  onToggleFavorite: (photo: PexelsPhoto) => void;
  isFavorite: boolean;
}

export function ImageCard({ photo, onImageClick, onToggleFavorite, isFavorite }: ImageCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{ backgroundColor: photo.avg_color }}
      onClick={() => onImageClick(photo)}
    >
      <img
        src={photo.src.medium}
        alt={photo.alt}
        className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-110"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-2 xs:p-3 sm:p-4 text-white transform translate-y-2 xs:translate-y-3 sm:translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <p className="font-semibold text-xs xs:text-sm mb-1 truncate">{photo.photographer}</p>
          <div className="flex items-center gap-1 xs:gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(photo);
              }}
              className={`p-1.5 xs:p-2 rounded-full transition-all duration-200 ${
                isFavorite
                  ? 'bg-rose-500 text-white scale-110'
                  : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
              }`}
            >
              <Heart className={`w-3 h-3 xs:w-4 xs:h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <a
              href={photo.src.original}
              download
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 xs:p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
            >
              <Download className="w-3 h-3 xs:w-4 xs:h-4" />
            </a>
            <a
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 xs:p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
            >
              <ExternalLink className="w-3 h-3 xs:w-4 xs:h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
