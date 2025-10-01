import { component$, useSignal, useVisibleTask$, $, type QRL } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";

export interface WebsiteCardProps {
  id: string;
  videoUrl: string;
  name: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  muted?: boolean;
  ref?: QRL<(el: HTMLVideoElement) => void>;
}

export const WebsiteCard = component$<WebsiteCardProps>(({
  id,
  videoUrl,
  name,
  width = '100%',
  height = '400px',
  borderRadius = '0',
  muted = true,
  ref: externalRef
}) => {
  const navigate = useNavigate();
  const videoRef = useSignal<HTMLVideoElement>();
  const isHovered = useSignal(false);

  const handleClick = $(() => {
    navigate(`/websites/${id}`);
  });

  // Handle external ref
  useVisibleTask$(({ track }) => {
    track(() => videoRef.value);
    if (videoRef.value && externalRef) {
      // Only call externalRef with defined video element
      externalRef(videoRef.value);
    }
    
    // Cleanup function
    return () => {
      if (externalRef) {
        externalRef(undefined as any);
      }
    };
  });

  const handleMouseOver = $(() => {
    isHovered.value = true;
    if (videoRef.value) {
      videoRef.value.play().catch(console.error);
    }
  });

  const handleMouseOut = $(() => {
    isHovered.value = false;
    if (videoRef.value) {
      videoRef.value.pause();
    }
  });

  return (
    <div
      onClick$={handleClick}
      style={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
        transition: 'transform 0.2s ease-in-out',
        cursor: 'pointer',
      }}
      onMouseOver$={handleMouseOver}
      onMouseOut$={handleMouseOut}
      class="hover:transform hover:-translate-y-1"
    >
      <video
        ref={videoRef}
        id={`video-${id}`}
        src={videoUrl}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: isHovered.value ? 1 : 0.8,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 500,
          padding: '6px 12px',
          borderRadius: '9999px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 'calc(100% - 32px)'
        }}
      >
        {name}
      </div>
    </div>
  );
});
