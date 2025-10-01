import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { getCategoryCounts, ALL_CATEGORIES } from '~/services/websiteService';

interface CategoryItemProps {
  name: string;
  count: number;
}

import { Link } from '@builder.io/qwik-city';

const CategoryItem = component$<CategoryItemProps>(({ name, count }) => {
  const isHovered = useSignal(false);
  
  // Convert name to URL-friendly format
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <Link 
      href={`/category/${slug}`}
      style={{
        textDecoration: 'none',
        display: 'block',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        transform: isHovered.value ? 'translateY(-2px)' : 'none',
        backgroundColor: isHovered.value ? '#f9f9f9' : '#fff',
        border: '1px solid #eee',
      }}
      onMouseEnter$={() => isHovered.value = true}
      onMouseLeave$={() => isHovered.value = false}
    >
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
        }}>
      <span style={{
        fontSize: '15px',
        color: '#333',
        fontWeight: 500
      }}>
        {name}
      </span>
      <span style={{
        fontSize: '13px',
        color: '#666',
        backgroundColor: '#f5f5f5',
        padding: '2px 8px',
        borderRadius: '10px',
        minWidth: '30px',
        textAlign: 'center'
      }}>
        {count}
      </span>
    </div>
    </Link>
  );
});

interface CategoryGroup {
  name: string;
  categories: Array<{name: string, count: number}>;
}

export default component$(() => {
  const categoryGroups = useSignal<CategoryGroup[]>([]);
  const isLoading = useSignal(true);

  useTask$(async () => {
    try {
      const allCategories = await getCategoryCounts();
      
      // Define our predefined groups
      const industryCategories = ALL_CATEGORIES.slice(0, 27); // First 27 are industry
      const productCategories = ALL_CATEGORIES.slice(27, 52); // Next 25 are product types
      const styleCategories = ALL_CATEGORIES.slice(52); // Rest are styles
      
      // Get categories for each group
      const getCategories = (names: string[]) => 
        allCategories.filter(cat => names.includes(cat.name));
      
      // Set the category groups
      categoryGroups.value = [
        { name: 'Industry', categories: getCategories(industryCategories) },
        { name: 'Product Type', categories: getCategories(productCategories) },
        { name: 'Style', categories: getCategories(styleCategories) }
      ];
      
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      isLoading.value = false;
    }
  });
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '350px',
      right: '350px',
      bottom: 0,
      backgroundColor: 'white',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '24px',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: '#e0e0e0 transparent',
        flex: '1 1 auto',
        marginRight: '-24px', // Compensate for scrollbar
        paddingRight: '48px'  // Add space for scrollbar
      }}>
      <div style={{
        marginBottom: '40px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '120px'
      }}>
        <h1 style={{
          fontSize: '72px',
          fontWeight: 800,
          margin: 0,
          padding: 0,
          color: '#000',
          lineHeight: 1,
          whiteSpace: 'nowrap'
        }}>
          Category
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#666',
          margin: 0,
          padding: '0 0 6px 0',
          fontWeight: 400,
          maxWidth: '400px'
        }}>
          Browse websites <br/>
          by categories
        </p>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        maxWidth: '800px'
      }}>
        {isLoading.value ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading categories...</div>
        ) : categoryGroups.value.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>No categories found</div>
        ) : (
          categoryGroups.value.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 16px 0',
                paddingBottom: '8px',
                borderBottom: '1px solid #eee'
              }}>
                {group.name}
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '12px',
                marginBottom: '32px'
              }}>
                {group.categories.map((category, index) => (
                  <CategoryItem 
                    key={`${group.name.toLowerCase().replace(/\s+/g, '-')}-${index}`} 
                    name={category.name} 
                    count={category.count} 
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
  );
});

export const head: DocumentHead = {
  title: "Browse - Gridrr",
  meta: [
    {
      name: "description",
      content: "Gridrr browse page",
    },
  ]
};
