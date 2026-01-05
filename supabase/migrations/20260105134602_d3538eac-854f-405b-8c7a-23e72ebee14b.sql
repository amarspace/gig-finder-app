-- Block all write operations on gigs table for client-side access
-- Gigs should only be managed via service role (backend/admin tools)

-- Create a policy that denies all INSERT operations
CREATE POLICY "No client-side insert on gigs"
ON public.gigs
FOR INSERT
WITH CHECK (false);

-- Create a policy that denies all UPDATE operations  
CREATE POLICY "No client-side update on gigs"
ON public.gigs
FOR UPDATE
USING (false);

-- Create a policy that denies all DELETE operations
CREATE POLICY "No client-side delete on gigs"
ON public.gigs
FOR DELETE
USING (false);