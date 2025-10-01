import { component$ } from "@builder.io/qwik";

interface FilterTabsProps {
  activeTab: 'latest' | 'popular';
  onTabChange$?: (tab: 'latest' | 'popular') => void;
}

export const FilterTabs = component$<FilterTabsProps>(({ activeTab, onTabChange$ }) => {
  return (
    <div style={{
      width: '100%',
      borderBottom: '1px solid #eee',
      margin: '64px 0 0',
    }}>
      <div style={{
        display: 'flex',
        gap: '24px',
        padding: '0 0 16px 0',
        width: '100%',
        paddingLeft: '0'
      }}>
        {(['latest', 'popular'] as const).map((tab) => (
          <div 
            key={tab}
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#000',
              cursor: 'pointer',
              padding: '8px 0 8px 16px',
              position: 'relative',
            }}
            onClick$={() => onTabChange$?.(tab)}
          >
            <div style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: activeTab === tab ? '#000' : 'transparent',
              transition: 'background-color 0.2s',
            }} />
            <span style={{
              color: activeTab === tab ? '#000' : '#666',
              fontWeight: activeTab === tab ? 700 : 500,
              textTransform: 'capitalize'
            }}>
              {tab}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
