import { component$, useSignal, useTask$, useVisibleTask$, useOnWindow } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { WebsiteCard } from '~/components/WebsiteCard';
import { getWebsites, type Website } from '~/services/websiteService';
import { $ } from '@builder.io/qwik';
import type { DocumentData } from 'firebase/firestore';

type SortOption = 'latest' | 'popular';

export default component$(() => {
  const allWebsites = useSignal<Website[]>([]);
  const filteredWebsites = useSignal<Website[]>([]);
  const isLoading = useSignal(true);
  const isLoadingMore = useSignal(false);
  const error = useSignal('');
  const loadedVideos = useSignal<Set<string>>(new Set());
  const videoRefs = useSignal<Record<string, HTMLVideoElement>>({});
  const activeSort = useSignal<SortOption>('latest');
  const hasMore = useSignal(true);
  // Store just the document ID instead of the full QueryDocumentSnapshot
  const lastDocId = useSignal<string | null>(null);
  const lastDocData = useSignal<DocumentData | null>(null);
  const PAGE_SIZE = 12; // Number of items to load per page

  // Add the spin animation for the loading spinner
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  });

  // Function to play videos with delay
  const playVideosWithDelay = $(async () => {
    // Initial delay of 3 seconds after load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get all video elements that haven't been played yet
    const videosToPlay = Object.entries(videoRefs.value)
      .filter(([id]) => !loadedVideos.value.has(id))
      .map(([id, ref]) => ({ id, ref }));
    
    // Play videos one by one with a delay
    for (const { id, ref } of videosToPlay) {
      if (ref && ref.play) {
        try {
          await ref.play();
          await ref.pause(); // Pause immediately after starting to play
          loadedVideos.value = new Set(loadedVideos.value).add(id);
        } catch (err) {
          console.error('Error playing video:', err);
        }
      }
    }
  });

  const loadWebsites = $(async (sortByParam: SortOption, loadMore = false) => {
    try {
      // Don't load more if we're already loading or there are no more items
      if ((isLoading.value || isLoadingMore.value) && loadMore) return;
      
      if (loadMore) {
        if (!hasMore.value) return; // Don't load more if we know there are no more items
        isLoadingMore.value = true;
      } else {
        isLoading.value = true;
        allWebsites.value = [];
        filteredWebsites.value = [];
        lastDocId.value = null;
        lastDocData.value = null;
        hasMore.value = true;
      }

      const lastDocToUse = loadMore && lastDocId.value && lastDocData.value
        ? { id: lastDocId.value, data: lastDocData.value }
        : null;

      const { websites, lastDoc: newLastDoc } = await getWebsites({
        sortBy: sortByParam,
        limit: PAGE_SIZE,
        offsetDoc: lastDocToUse
      });

      // If no websites were returned, we've reached the end
      if (websites.length === 0) {
        hasMore.value = false;
        isLoading.value = false;
        isLoadingMore.value = false;
        return;
      }

      // Check if we got fewer items than requested, which means we've reached the end
      if (websites.length < PAGE_SIZE) {
        hasMore.value = false;
      }

      if (loadMore) {
        // Filter out any duplicates that might already be in the list
        const existingIds = new Set(allWebsites.value.map(w => w.id));
        const newWebsites = websites.filter(w => !existingIds.has(w.id));
        
        if (newWebsites.length === 0) {
          // If all fetched websites are already in the list, we've reached the end
          hasMore.value = false;
        } else {
          allWebsites.value = [...allWebsites.value, ...newWebsites];
          filteredWebsites.value = [...filteredWebsites.value, ...newWebsites];
        }
      } else {
        allWebsites.value = websites;
        filteredWebsites.value = [...websites];
      }

      // Store the simplified document reference
      if (newLastDoc) {
        lastDocId.value = newLastDoc.id;
        lastDocData.value = newLastDoc.data;
      } else {
        lastDocId.value = null;
        lastDocData.value = null;
      }
      
      // After setting websites, wait for the next tick to ensure refs are set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start the staggered playback for new videos only
      playVideosWithDelay();
    } catch (err) {
      error.value = 'Failed to load websites. Please try again later.';
      console.error('Error loading websites:', err);
    } finally {
      isLoading.value = false;
      isLoadingMore.value = false;
    }
  });

  // Initial load
  useTask$(async () => {
    await loadWebsites(activeSort.value, false);
  });

  const handleSortChange = $((sortBy: SortOption) => {
    if (activeSort.value === sortBy) return;
    
    activeSort.value = sortBy;
    hasMore.value = true;
    loadWebsites(sortBy, false);
  });

  // Handle infinite scroll
  useOnWindow(
    'scroll',
    $(() => {
      if (isLoading.value || isLoadingMore.value || !hasMore.value) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const bottomThreshold = document.body.offsetHeight - 500; // Start loading 500px before bottom

      if (scrollPosition >= bottomThreshold) {
        loadWebsites(activeSort.value, true);
      }
    })
  );

  return (
    <div id="app">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 48px',
        backgroundColor: 'white',
      }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
        }}>
          <div style={{
            height: '40px',
            display: 'flex',
            alignItems: 'center',
          }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{
                height: '90%',
                width: '90%',
                objectFit: 'contain',
              }}
            />
          </div>
        </Link>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#333',
            padding: '8px 16px',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}>
            Submit
          </div>
          <a 
            href="/browse" 
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#333',
              padding: '8px 16px',
              fontFamily: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseOver$={(e: MouseEvent) => {
              const target = e.target as HTMLAnchorElement;
              target.style.color = '#000';
            }}
            onMouseOut$={(e: MouseEvent) => {
              const target = e.target as HTMLAnchorElement;
              target.style.color = '#333';
            }}
          >
            Browse
          </a>
        </div>
      </div>
      
      <div style={{
        padding: '20px 0 0 48px',
        maxWidth: '800px',
        margin: 0,
        textAlign: 'left',
      }}>
        <h1 style={{
          fontSize: '72px',
          fontWeight: 800,
          color: '#333',
          margin: '64px 0 0',
          lineHeight: 1,
        }}>
          Curated Website<br /> 
          Design Inspiration
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#666',
          margin: '8px 0 0',
          lineHeight: 1.2,
        }}>
          Discover and curate the best website designs from around the world.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '6px',
          marginTop: '32px',
          maxWidth: '500px',
        }}>
          <input
            type="email"
            placeholder="Your email address"
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '15px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
            onFocus$={(e: FocusEvent) => {
              const target = e.target as HTMLInputElement;
              target.style.borderColor = '#666';
            }}
            onBlur$={(e: FocusEvent) => {
              const target = e.target as HTMLInputElement;
              target.style.borderColor = '#ddd';
            }}
          />
          <button
            style={{
              padding: '0 24px',
              fontSize: '15px',
              fontWeight: 600,
              color: 'white',
              backgroundColor: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver$={(e: MouseEvent) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#333';
            }}
            onMouseOut$={(e: MouseEvent) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#000';
            }}
          >
            Subscribe
          </button>
        </div>

      </div>
      
      {/* Full Width Divider */}
      <div style={{
        width: '100%',
        borderBottom: '1px solid #eee',
        margin: '64px 0 0',
      }}>
        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '24px',
          padding: '0 0 16px 0',
          maxWidth: '800px',
          margin: '0 0 0 48px',
        }}>
          <div 
            onClick$={() => handleSortChange('latest')}
            style={{
              fontSize: '16px',
              fontWeight: activeSort.value === 'latest' ? 700 : 500,
              color: activeSort.value === 'latest' ? '#000' : '#666',
              cursor: 'pointer',
              padding: '8px 0 8px 16px',
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            {activeSort.value === 'latest' && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#000',
              }} />
            )}
            <span>Latest</span>
          </div>
          <div 
            onClick$={() => handleSortChange('popular')}
            style={{
              fontSize: '16px',
              fontWeight: activeSort.value === 'popular' ? 700 : 500,
              color: activeSort.value === 'popular' ? '#000' : '#666',
              cursor: 'pointer',
              padding: '8px 0 8px 16px',
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            {activeSort.value === 'popular' && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#000',
              }} />
            )}
            <span>Popular</span>
          </div>
        </div>
      </div>
      
      {/* Website Cards Grid */}
      <div style={{
        padding: '32px 0 64px',
        width: '100%',
        minHeight: 'calc(100vh - 200px)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '16px',
          width: '100%',
          padding: '0 48px',
          boxSizing: 'border-box',
        }}>
          {isLoading.value ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center',
              padding: '40px 0',
              color: '#666'
            }}>
              Loading...
            </div>
          ) : error.value ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center',
              color: 'red',
              padding: '40px 0'
            }}>
              {error.value}
            </div>
          ) : filteredWebsites.value.length > 0 ? (
            filteredWebsites.value.map((website) => (
              <WebsiteCard 
                key={website.id}
                id={website.id}
                videoUrl={website.videoUrl}
                name={website.name}
                width="100%"
                height="400px"
                borderRadius="0"
                ref={$((el: HTMLVideoElement) => {
                  if (el) {
                    videoRefs.value = { ...videoRefs.value, [website.id]: el };
                  } else {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { [website.id]: _, ...rest } = videoRefs.value;
                    videoRefs.value = rest;
                  }
                })}
              />
            ))
          ) : (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center',
              padding: '40px 0',
              color: '#666'
            }}>
              No websites found. {filteredWebsites.value.length === 0 && allWebsites.value.length > 0 ? 'Try a different filter.' : 'Check back later!'}
            </div>
          )}
          
          {/* Loading more indicator */}
          {isLoadingMore.value && (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center',
              padding: '20px 0',
              color: '#666',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #000',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
              <span>Loading more websites...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});


export const head: DocumentHead = {
  title: "Gridrr",
  meta: [
    {
      name: "description",
      content: "Gridrr - Discover and share beautiful website designs",
    },
  ]
};
