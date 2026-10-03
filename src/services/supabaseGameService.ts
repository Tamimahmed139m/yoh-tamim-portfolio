import { Game } from '../types/game';
import { supabase } from './supabaseClient';

const fromRow = (row: any): Game => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  category: row.category,
  categories: row.categories ?? [],
  thumbnailUrl: row.thumbnail_url,
  description: row.description,
  controls: row.controls,
  howToPlay: row.how_to_play ?? '',
  gameUrl: row.game_url,
  featured: Boolean(row.featured),
  popular: Boolean(row.popular),
  isNew: Boolean(row.is_new),
  rating: Number(row.rating ?? 4.5),
  plays: Number(row.plays ?? 0),
  dateAdded: row.date_added ?? new Date().toISOString().slice(0, 10),
  playableType: row.playable_type,
  customSourceHtml: row.custom_source_html ?? undefined,
  tags: row.tags ?? [],
});

export async function fetchSupabaseGames(): Promise<Game[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('games').select('*').order('date_added', { ascending: false });
  if (error) {
    console.warn('Supabase games query failed:', error.message);
    return [];
  }
  return (data ?? []).map(fromRow);
}
