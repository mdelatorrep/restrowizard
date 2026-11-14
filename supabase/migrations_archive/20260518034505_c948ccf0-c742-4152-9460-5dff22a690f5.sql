-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Sources table
CREATE TABLE public.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_ref TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_sources_user ON public.knowledge_sources(user_id);
CREATE INDEX idx_knowledge_sources_type ON public.knowledge_sources(source_type);

ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own knowledge sources"
  ON public.knowledge_sources FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own knowledge sources"
  ON public.knowledge_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own knowledge sources"
  ON public.knowledge_sources FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own knowledge sources"
  ON public.knowledge_sources FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_knowledge_sources_updated
  BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chunks table
CREATE TABLE public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_chunks_source ON public.knowledge_chunks(source_id);
CREATE INDEX idx_knowledge_chunks_user ON public.knowledge_chunks(user_id);
CREATE INDEX idx_knowledge_chunks_embedding ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own knowledge chunks"
  ON public.knowledge_chunks FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own knowledge chunks"
  ON public.knowledge_chunks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own knowledge chunks"
  ON public.knowledge_chunks FOR DELETE
  USING (auth.uid() = user_id);

-- Search function
CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding vector(768),
  match_user_id UUID,
  match_count INTEGER DEFAULT 5,
  min_similarity FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  chunk_id UUID,
  source_id UUID,
  source_title TEXT,
  source_type TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    kc.id AS chunk_id,
    kc.source_id,
    ks.title AS source_title,
    ks.source_type,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  JOIN public.knowledge_sources ks ON ks.id = kc.source_id
  WHERE kc.user_id = match_user_id
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > min_similarity
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;