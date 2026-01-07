-- Política para usuários verem suas próprias contas
CREATE POLICY "Users can view their own accounts"
ON public.accounts
FOR SELECT
USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias contas
CREATE POLICY "Users can create their own accounts"
ON public.accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias contas
CREATE POLICY "Users can update their own accounts"
ON public.accounts
FOR UPDATE
USING (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias contas
CREATE POLICY "Users can delete their own accounts"
ON public.accounts
FOR DELETE
USING (auth.uid() = user_id);