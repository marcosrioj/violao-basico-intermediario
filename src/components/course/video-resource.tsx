'use client';
import { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
function youtubeId(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be')
      return /^[\w-]{11}$/.test(u.pathname.slice(1)) ? u.pathname.slice(1) : null;
    if (['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(u.hostname)) {
      const id = u.searchParams.get('v');
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
  } catch {}
  return null;
}
export function VideoResource({ url, title }: { url: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const id = youtubeId(url);
  return (
    <div>
      {loaded && id ? (
        <iframe
          className="video-frame"
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={`Referência musical: ${title}`}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="video-placeholder">
          <Play size={28} />
          <h3>Escute antes de tocar</h3>
          <p>{title}</p>
          {id ? (
            <button className="button cream" onClick={() => setLoaded(true)}>
              Carregar vídeo de referência
            </button>
          ) : (
            <a className="button cream" href={url} target="_blank" rel="noopener noreferrer">
              Abrir gravação <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}
      <p className="video-consent">
        O vídeo só se conecta ao YouTube ao ser carregado. Links externos podem usar cookies
        próprios.
      </p>
    </div>
  );
}
