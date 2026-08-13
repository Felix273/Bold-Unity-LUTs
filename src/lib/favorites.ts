import supabase from './supabase'

export async function fetchFavoriteIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('favorites')
    .select('lut_id')
    .eq('user_id', userId)

  if (error) throw error
  return new Set((data ?? []).map((row) => row.lut_id))
}

export async function addFavorite(userId: string, lutId: string) {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, lut_id: lutId })

  if (error) throw error
}

export async function removeFavorite(userId: string, lutId: string) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('lut_id', lutId)

  if (error) throw error
}
