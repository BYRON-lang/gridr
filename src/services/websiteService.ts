import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  increment,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
// Import from the Firebase configuration file
import { db } from '../config/firebase';

// Helper function to convert Firestore data to plain objects
function convertTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Convert Firestore Timestamp to ISO string
  if (obj instanceof Timestamp) {
    return obj.toDate().toISOString();
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertTimestamps(obj[key]);
      }
    }
    return result;
  }
  
  // Return primitives as-is
  return obj;
}

/* ------------------ 🔹 Interfaces ------------------ */

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  [key: string]: string | undefined;
}

export interface Website {
  id: string;
  name: string;
  videoUrl: string;
  url: string;
  builtWith?: string;
  categories: string[];
  socialLinks?: SocialLinks;
  uploadedAt: string; // ISO string
  category?: string; // For backward compatibility
  views?: number;
}

export interface CategoryCount {
  name: string;
  count: number;
}

/* ------------------ 🔹 Helpers ------------------ */

// Convert Firestore timestamp → ISO
const convertTimestamp = (timestamp: any): string => {
  if (timestamp?.toDate) return timestamp.toDate().toISOString();
  if (timestamp?.seconds) return new Date(timestamp.seconds * 1000).toISOString();
  return new Date().toISOString();
};

// Normalize category names for case-insensitive matching
const normalizeCategoryName = (name: string): string =>
  name.trim().toLowerCase();

/* ------------------ 🔹 Caching Layer ------------------ */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 1000 * 60; // 1 minute

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

/* ------------------ 🔹 Get All Websites for Sitemap ------------------ */

export interface WebsiteForSitemap {
  id: string;
  updatedAt?: string;
}

export async function getAllWebsitesForSitemap(): Promise<WebsiteForSitemap[]> {
  try {
    const websitesCollection = collection(db, 'websites');
    const q = query(websitesCollection, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const websites: WebsiteForSitemap[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      websites.push({
        id: doc.id,
        updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString()
      });
    });
    
    return websites;
  } catch (error) {
    console.error('Error fetching all websites for sitemap:', error);
    return [];
  }
}

/* ------------------ 🔹 Get Website By ID ------------------ */

export const getWebsiteById = async (id: string): Promise<Website> => {
  try {
    const docRef = doc(db, 'websites', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Website not found');
    }
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || 'Untitled',
      videoUrl: data.videoUrl || '',
      url: data.url || '#',
      builtWith: data.builtWith,
      categories: Array.isArray(data.categories) ? data.categories : [],
      socialLinks: data.socialLinks || {},
      uploadedAt: convertTimestamp(data.uploadedAt),
      views: data.views || 0,
    } as Website;
  } catch (err) {
    console.error('Error getting website:', err);
    throw err;
  }
};

/* ------------------ 🔹 Paginated Websites ------------------ */

export interface GetWebsitesOptions {
  sortBy?: 'latest' | 'popular';
  limit?: number;
  offsetDoc?: { id: string; data: DocumentData } | null; // Simplified document reference
  category?: string;
}

export interface GetWebsitesResult {
  websites: Website[];
  lastDoc: { id: string; data: DocumentData } | null;
}

export const getWebsites = async (
  options: GetWebsitesOptions = {}
): Promise<GetWebsitesResult> => {
  try {
    const { sortBy = 'latest', limit: pageSize, offsetDoc, category } = options;

    const cacheKey = `websites-${category || 'all'}-${sortBy}-${offsetDoc?.id || 'first'}-${pageSize || 'all'}`;
    const cached = getFromCache<GetWebsitesResult>(cacheKey);
    if (cached) return cached;

    const websitesRef = collection(db, 'websites');

    // Base query
    let q =
      sortBy === 'popular'
        ? query(websitesRef, orderBy('views', 'desc'))
        : query(websitesRef, orderBy('uploadedAt', 'desc'));

    // Pagination
    if (offsetDoc) {
      // Recreate the document reference from the simplified version
      const docRef = doc(db, 'websites', offsetDoc.id);
      q = query(q, startAfter(docRef));
    }
    
    if (pageSize) {
      q = query(q, limit(pageSize));
    }

    const querySnapshot = await getDocs(q);

    const results: Website[] = [];
    let lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null as unknown as QueryDocumentSnapshot<DocumentData>;
    
    querySnapshot.forEach((doc) => {
      // Convert all Firestore data to plain objects with ISO string dates
      const rawData = doc.data();
      const data = convertTimestamps(rawData);
      
      const websiteData: Website = {
        id: doc.id,
        name: data.name || 'Untitled',
        videoUrl: data.videoUrl || '',
        url: data.url || '#',
        builtWith: data.builtWith,
        categories: Array.isArray(data.categories) ? data.categories : [],
        socialLinks: data.socialLinks || {},
        uploadedAt: data.uploadedAt || new Date().toISOString(),
        category: Array.isArray(data.categories) && data.categories.length > 0
          ? data.categories[0]
          : 'uncategorized',
        views: data.views || 0,
      };
      
      results.push(websiteData);
      // Type assertion to handle Firestore's DocumentData type
      lastVisibleDoc = doc as unknown as QueryDocumentSnapshot<DocumentData>;
    });

    // Filter by category if specified
    let filteredResults = results;
    if (category) {
      const searchCategory = normalizeCategoryName(category);
      filteredResults = results.filter(site => 
        site.categories.some(cat => 
          normalizeCategoryName(cat) === searchCategory
        )
      );
    }

    // Sort results
    if (sortBy === 'popular') {
      filteredResults.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      filteredResults.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    }

    const result = { 
      websites: filteredResults, 
      lastDoc: lastVisibleDoc ? { 
        id: lastVisibleDoc.id, 
        data: convertTimestamps(lastVisibleDoc.data()) 
      } : null 
    };
    
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching websites:', error);
    return { websites: [], lastDoc: null };
  }
};

/* ------------------ 🔹 Adjacent Websites (Prev/Next) ------------------ */

export const getAdjacentWebsites = async (
  currentId: string,
  sortBy: 'latest' | 'popular' = 'latest'
): Promise<{ prev: Website | null; next: Website | null }> => {
  try {
    // Fetch a batch (e.g., 50) to find neighbors
    const { websites } = await getWebsites({ sortBy, limit: 50 });
    const index = websites.findIndex((w) => w.id === currentId);

    return {
      prev: index < websites.length - 1 ? websites[index + 1] : null,
      next: index > 0 ? websites[index - 1] : null,
    };
  } catch (err) {
    console.error('Error getting adjacent websites:', err);
    return { prev: null, next: null };
  }
};

/* ------------------ 🔹 Increment Views ------------------ */

export const incrementWebsiteViews = async (websiteId: string): Promise<void> => {
  try {
    const websiteRef = doc(db, 'websites', websiteId);
    await updateDoc(websiteRef, {
      views: increment(1),
      lastViewed: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error incrementing website views:', error);
    // swallow error (don’t break UI)
  }
};

/* ------------------ 🔹 Categories ------------------ */

export const ALL_CATEGORIES = [
  'SaaS', 'E-commerce', 'Finance', 'Healthcare', 'Education',
  'Technology', 'Marketing', 'Design', 'Startup', 'Agency',
  'Nonprofit', 'Real Estate', 'Food & Beverage', 'Fitness',
  'Travel', 'Entertainment', 'Media', 'Consulting', 'Legal',
  'Manufacturing', 'Retail', 'Fashion', 'Beauty',
  'Home Services', 'Automotive', 'AI', 'UI/UX',

  'Landing Page', 'Dashboard', 'Mobile App', 'Web App', 'Blog',
  'Portfolio', 'Personal', 'Docs', 'Marketing', 'Pricing',
  'Auth', 'Onboarding', 'Careers', 'Contact', 'About',
  'Case Studies', 'Help Center', 'Knowledge Base', 'Status Page',
  'Blog Platform', 'Checkout', 'Booking', 'Directory',
  'Newsletter', 'Community',

  'Minimal', 'Bold', 'Dark Mode', 'Light Mode', 'Gradient',
  '3D', 'Motion', 'Illustration', 'Photography', 'Typography',
  'Neumorphism', 'Glassmorphism', 'Brutalist', 'Vintage', 'Modern',
  'Retro', 'Futuristic', 'Playful', 'Corporate', 'Elegant',
  'Hand-drawn', 'Geometric', 'Abstract', 'Creative',
];

/* ------------------ 🔹 Category Counts ------------------ */

export const getCategoryCounts = async (): Promise<CategoryCount[]> => {
  try {
    const cacheKey = 'category-counts';
    const cached = getFromCache<CategoryCount[]>(cacheKey);
    if (cached) return cached;

    const { websites } = await getWebsites();
    const categoryMap = new Map<string, number>();
    const normalizedCategoryMap = new Map<string, string>();

    ALL_CATEGORIES.forEach((cat) => {
      const norm = normalizeCategoryName(cat);
      categoryMap.set(cat, 0);
      normalizedCategoryMap.set(norm, cat);
    });

    websites.forEach((site) => {
      site.categories?.forEach((cat) => {
        const norm = normalizeCategoryName(cat);
        const matched = normalizedCategoryMap.get(norm);
        if (matched) {
          categoryMap.set(matched, (categoryMap.get(matched) || 0) + 1);
        }
      });
    });

    const result = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching category counts:', error);
    return [];
  }
};
