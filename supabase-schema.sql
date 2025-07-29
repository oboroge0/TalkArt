-- TalkArt Database Schema for Supabase

-- Create artworks table
CREATE TABLE IF NOT EXISTS talkart_artworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  share_code TEXT UNIQUE,
  view_count INTEGER DEFAULT 0 NOT NULL
);

-- Create indexes
CREATE INDEX idx_talkart_artworks_session_id ON talkart_artworks(session_id);
CREATE INDEX idx_talkart_artworks_created_at ON talkart_artworks(created_at DESC);
CREATE INDEX idx_talkart_artworks_share_code ON talkart_artworks(share_code);

-- Enable Row Level Security
ALTER TABLE talkart_artworks ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to read artworks
CREATE POLICY "Allow public read access" ON talkart_artworks
  FOR SELECT USING (true);

-- Allow authenticated users to insert artworks
CREATE POLICY "Allow public insert access" ON talkart_artworks
  FOR INSERT WITH CHECK (true);

-- Allow updating view count
CREATE POLICY "Allow public update view count" ON talkart_artworks
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create storage bucket for artworks
-- Run this in Supabase Dashboard under Storage
-- 1. Create bucket named 'talkart-artworks'
-- 2. Make it public
-- 3. Add policy to allow public uploads and downloads

-- Function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate share code
CREATE OR REPLACE FUNCTION set_share_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_code IS NULL THEN
    NEW.share_code := generate_share_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_share_code_trigger
  BEFORE INSERT ON talkart_artworks
  FOR EACH ROW
  EXECUTE FUNCTION set_share_code();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(artwork_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE talkart_artworks
  SET view_count = view_count + 1
  WHERE id = artwork_id;
END;
$$ LANGUAGE plpgsql;