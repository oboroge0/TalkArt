import { createClient } from '@supabase/supabase-js'

// Database types
export interface TalkArtArtwork {
  id: string
  session_id: string
  image_url: string
  prompt: string
  responses: {
    questionId: string
    answer: string
  }[]
  created_at: string
  updated_at: string
  share_code?: string
  view_count: number
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Some features may not work.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Storage bucket name
export const ARTWORK_BUCKET = 'talkart-artworks'

// Helper functions
export const getPublicUrl = (path: string): string => {
  if (!supabase) return ''
  const { data } = supabase.storage.from(ARTWORK_BUCKET).getPublicUrl(path)
  return data.publicUrl
}