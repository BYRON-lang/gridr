import { component$, useSignal, useVisibleTask$, useTask$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead, Link, useLocation, useNavigate } from '@builder.io/qwik-city';
import { getWebsiteById, type Website, incrementWebsiteViews } from '~/services/websiteService';

// Create a route loader to fetch website data
export const useWebsiteData = routeLoader$(async ({ params }) => {
  try {
    return await getWebsiteById(params.id);
  } catch (error) {
    console.error('Error loading website data:', error);
    return null;
  }
});

export default component$(() => {
  const websiteData = useWebsiteData();
  const website = useSignal<Website | null>(null);
  const nav = useNavigate();
  const categoryLinks = useSignal<Array<{href: string, text: string}>>([]);
  const location = useLocation();
  const isLoading = useSignal(true);
  const error = useSignal('');
  const videoRef = useSignal<HTMLVideoElement>();
  const isReversing = useSignal(false);
  const reverseSpeed = 0.5;
  let reverseRAF: number | null = null;
  let lastFrameTime = 0;

  useVisibleTask$(({ cleanup }) => {
    const video = videoRef.value;
    if (!video) return;

    const reverseLoop = (vid: HTMLVideoElement) => {
      if (!isReversing.value) return;

      const now = performance.now();
      const delta = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      vid.currentTime = Math.max(0, vid.currentTime - delta * reverseSpeed);

      if (vid.currentTime <= 0) {
        isReversing.value = false;
        vid.currentTime = 0;
        vid.playbackRate = 1;
        vid.play().catch(console.error);
        return;
      }

      reverseRAF = requestAnimationFrame(() => reverseLoop(vid));
    };

    const handleEnded = () => {
      isReversing.value = true;
      video.pause();
      lastFrameTime = performance.now();
      reverseLoop(video);
    };

    video.addEventListener('ended', handleEnded);

    cleanup(() => {
      video.removeEventListener('ended', handleEnded);
      if (reverseRAF) cancelAnimationFrame(reverseRAF);
      isReversing.value = false;
    });
  });

  useTask$(async () => {
    try {
      if (websiteData.value) {
        website.value = websiteData.value;
        // Increment view count after loading the website data
        await incrementWebsiteViews(websiteData.value.id);
      }
    } catch (err) {
      error.value = 'Failed to load website details';
      console.error('Error:', err);
    } finally {
      isLoading.value = false;
    }
  });

  return (
    <div style={{ padding: '24px' }}>
      {/* Back button */}
      <button
        onClick$={() => nav(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#000',
          cursor: 'pointer',
          padding: '8px 16px',
          borderRadius: '8px',
          transition: 'color 0.2s',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span style={{ fontSize: '18px', fontWeight: 500 }}>Back</span>
      </button>

      {/* Content */}
      {isLoading.value ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading...</div>
      ) : error.value ? (
        <div style={{ color: 'red', textAlign: 'center', padding: '40px 0' }}>{error.value}</div>
      ) : website.value ? (
        <>
          <video
            ref={videoRef}
            src={website.value.videoUrl}
            autoplay
            playbackRate={0.75}
            muted
            playsInline
            style={{
              width: '80%',
              height: 'auto',
              margin: '20px auto 0',
              maxHeight: '90vh',
              objectFit: 'contain',
              display: 'block',
            }}
          >
            Your browser does not support the video tag.
          </video>
          <div style={{
            width: '80%',
            margin: '10px auto 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              width: '100%'
            }}>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '600',
                color: '#333',
                margin: 0
              }}>
                {website.value.name}
              </h1>
            <a 
              href={`${website.value.url || '#'}${website.value.url?.includes('?') ? '&' : '?'}ref=gridrr`} 
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '18px',
                color: '#333',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
                padding: '8px 0'
              }}
              onMouseOver$={(e) => {
                const target = e.target as HTMLElement;
                target.style.color = '#666';
              }}
              onMouseOut$={(e) => {
                const target = e.target as HTMLElement;
                target.style.color = '#333';
              }}
            >
              Visit Website
              <svg width="20" height="20" viewBox="0 0 25 25" fill="currentColor">
                <path d="M18.92 6.05a.75.75 0 0 0-.598-.297L9.327 5.75a.75.75 0 1 0 0 1.5l7.19.002l-10.72 10.72a.75.75 0 0 0 1.061 1.06L17.573 8.318l.002 7.177a.75.75 0 0 0 1.5-.001l-.003-8.933a.75.75 0 0 0-.152-.51"/>
              </svg>
            </a>
          </div>
            {website.value.categories && website.value.categories.length > 0 && (
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                  fontSize: '20px',
                  color: '#000', // Changed to black
                  width: '80px',
                  flexShrink: 0,
                  paddingTop: '3px',
                  marginBottom: '8px',
                  fontWeight: '500' // Slightly bolder for better hierarchy
                }}>
                  Categories
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginLeft: '72px', // Increased left margin to move list further right
                  marginTop: '6px'
                }}>
                  {website.value.categories.map((category, index) => (
                    <li 
                      key={index}
                      style={{
                        fontSize: '15px',
                        color: '#666',
                        padding: '2px 0',
                        listStyleType: 'none',
                        marginLeft: '0',
                        paddingLeft: '0'
                      }}
                    >
                      <Link 
                        href={`/category/${encodeURIComponent(category)}`}
                        style={{
                          color: '#666',
                          textDecoration: 'none',
                          display: 'block',
                          transition: 'color 0.2s'
                        }}
                        class="hover:underline hover:text-black hover:underline-offset-2"
                      >
                        {category}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {website.value.builtWith && (
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                  fontSize: '20px',
                  color: '#000',
                  width: '80px',
                  flexShrink: 0,
                  paddingTop: '3px',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Built With
                </div>
                <div style={{
                  color: '#666',
                  fontSize: '15px',
                  marginLeft: '72px',
                  marginTop: '6px'
                }}>
                  {website.value.builtWith}
                </div>
              </div>
            )}

            {/* Date Added */}
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-start' }}>
              <div style={{
                fontSize: '20px',
                color: '#000',
                width: '80px',
                flexShrink: 0,
                paddingTop: '3px',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Added
              </div>
              <div style={{
                color: '#666',
                fontSize: '15px',
                marginLeft: '72px',
                marginTop: '6px'
              }}>
                {new Date(website.value.uploadedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* Socials */}
            {website.value.socialLinks && Object.keys(website.value.socialLinks).length > 0 && (
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                  fontSize: '20px',
                  color: '#000',
                  width: '80px',
                  flexShrink: 0,
                  paddingTop: '3px',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Socials
                </div>
                <div style={{
                  marginLeft: '72px',
                  marginTop: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {Object.entries(website.value.socialLinks).map(([platform, url]) => (
                    url && (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#666',
                          textDecoration: 'none',
                          fontSize: '15px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'color 0.2s',
                        }}
                        className="hover:text-black hover:underline hover:underline-offset-2"
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '4px' }}>
                          <path 
                            d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m0-6-7 7" 
                            stroke="currentColor" 
                            stroke-width="2" 
                            stroke-linecap="round" 
                            stroke-linejoin="round"
                          />
                        </svg>
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
            
            {/* Views */}
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-start' }}>
              <div style={{
                fontSize: '20px',
                color: '#000',
                width: '80px',
                flexShrink: 0,
                paddingTop: '3px',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Views
              </div>
              <div style={{
                color: '#666',
                fontSize: '15px',
                marginLeft: '72px',
                marginTop: '6px'
              }}>
                {website.value.views?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
});

// Use the route data for the head
export const head: DocumentHead = ({ resolveValue }) => {
  const website = resolveValue(useWebsiteData);
  const title = website?.name ? `${website.name} - Gridrr` : 'Loading...';
  
  return {
    title,
    meta: [
      {
        name: 'description',
        content: website?.name ? `View ${website.name} on Gridrr` : 'Website details page',
      },
    ],
  };
};
