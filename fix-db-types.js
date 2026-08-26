const fs = require('fs');
let content = fs.readFileSync('src/lib/supabase/database.types.ts', 'utf8');

if (!content.includes('social_links: {')) {
  const insertIndex = content.indexOf('site_settings: {');
  if (insertIndex !== -1) {
    const tableDef = `      social_links: {
        Relationships: [];
        Row: {
          id: string;
          platform: string;
          url: string;
          icon_name: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform: string;
          url: string;
          icon_name?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          platform?: string;
          url?: string;
          icon_name?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
`;
    content = content.slice(0, insertIndex) + tableDef + content.slice(insertIndex);
    fs.writeFileSync('src/lib/supabase/database.types.ts', content);
    console.log('Added social_links table to database.types.ts');
  }
}
