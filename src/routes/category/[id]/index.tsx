import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { type RequestEvent } from '@builder.io/qwik-city';
import { WebsiteCard } from '~/components/WebsiteCard';
import { FilterTabs } from '~/components/FilterTabs';
import { getWebsites, type Website } from '~/services/websiteService';
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

export const onGet: RequestHandler = async (event: RequestEvent) => {
  // Add caching if needed
  event.headers.set('Cache-Control', 'public, max-age=3600');
};

export default component$(() => {
  const location = useLocation();
  const websites = useSignal<Website[]>([]);
  const isLoading = useSignal(true);
  const isLoadingMore = useSignal(false);
  const sortBy = useSignal<'latest' | 'popular'>('latest');
  const hasMore = useSignal(true);
  const lastDocId = useSignal<string | null>(null);
  const lastDocData = useSignal<DocumentData | null>(null);

  const PAGE_SIZE = 12;

  // Get category from URL
  const categoryId = location.params.id;
  const categoryName = decodeURIComponent(categoryId)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
  const categorySlug = categoryName.toLowerCase();

  // Fetch websites by category
  const loadWebsites = $(async (loadMore = false) => {
    try {
      // Don't load more if we're already loading or there are no more items
      if ((isLoading.value || isLoadingMore.value) && loadMore) return;
      
      if (loadMore) {
        if (!hasMore.value) return; // Don't load more if we know there are no more items
        isLoadingMore.value = true;
      } else {
        isLoading.value = true;
        websites.value = [];
        lastDocId.value = null;
        lastDocData.value = null;
        hasMore.value = true;
      }

      const offsetDoc = loadMore && lastDocId.value && lastDocData.value
        ? { id: lastDocId.value, data: lastDocData.value }
        : null;

      const { websites: fetchedWebsites, lastDoc: newLastDoc } = await getWebsites({
        category: categorySlug,
        sortBy: sortBy.value,
        limit: PAGE_SIZE,
        offsetDoc,
      });

      // If no websites were returned, we've reached the end
      if (fetchedWebsites.length === 0) {
        hasMore.value = false;
        return;
      }

      // Check if we got fewer items than requested, which means we've reached the end
      if (fetchedWebsites.length < PAGE_SIZE) {
        hasMore.value = false;
      }

      if (loadMore) {
        // Filter out any duplicates that might already be in the list
        const existingIds = new Set(websites.value.map(w => w.id));
        const newWebsites = fetchedWebsites.filter(w => !existingIds.has(w.id));
        
        if (newWebsites.length === 0) {
          // If all fetched websites are already in the list, we've reached the end
          hasMore.value = false;
        } else {
          websites.value = [...websites.value, ...newWebsites];
        }
      } else {
        websites.value = fetchedWebsites;
      }

      if (newLastDoc) {
        lastDocId.value = newLastDoc.id;
        lastDocData.value = newLastDoc.data;
      } else {
        lastDocId.value = null;
        lastDocData.value = null;
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      isLoading.value = false;
      isLoadingMore.value = false;
    }
  });

  // Initial + refetch on sort change
  useTask$(async ({ track }) => {
    track(() => [categoryId, sortBy.value]);
    await loadWebsites(false);
  });

  return (
    <div id="app" style={{
      minHeight: '100vh',
      backgroundColor: 'white',
      padding: '0 48px'
    }}>
      {/* Header with Logo */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 0',
        backgroundColor: 'white',
      }}>
        <div style={{
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}>
          <img 
            src="/logo.png" 
            alt="Gridrr Logo" 
            style={{
              height: '90%',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main style={{
        padding: '24px 0',
        maxWidth: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '52px',
          fontWeight: '900',
          color: '#333',
          margin: '0 0 40px 0',
          padding: 0,
          width: '100%',
          maxWidth: '800px'
        }}>
          {categoryName} Websites
        </h1>

        <FilterTabs 
          activeTab={sortBy.value}
          onTabChange$={$((tab: 'latest' | 'popular') => {
            sortBy.value = tab;
          })}
        />
      
        {/* Website Cards Grid */}
        <div style={{
          padding: '32px 0 64px',
          width: '100%',
          minHeight: 'calc(100vh - 200px)',
        }}>
          {isLoading.value ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center',
              padding: '40px 0'
            }}>
              Loading...
            </div>
          ) : websites.value.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '16px',
              width: '100%',
              padding: '0 48px',
              boxSizing: 'border-box',
            }}>
              {websites.value.map((website) => (
                <WebsiteCard
                  key={website.id}
                  id={website.id}
                  videoUrl={website.videoUrl}
                  name={website.name}
                  width="100%"
                  height="400px"
                  borderRadius="0"
                />
              ))}
            </div>
          ) : (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center',
              padding: '40px 0',
              color: '#666'
            }}>
              No websites found in this category.
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
      </main>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Category - Gridrr',
  meta: [
    {
      name: 'description',
      content: 'Browse websites by category',
    },
  ],
};
