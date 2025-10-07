-- Migration: 002 rls_policies

-- Up:
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Workspaces policies
CREATE POLICY "Users can view workspaces they are members of" ON public.workspaces
    FOR SELECT USING (
        id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workspace admins can update workspaces" ON public.workspaces
    FOR UPDATE USING (
        id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Workspace admins can delete workspaces" ON public.workspaces
    FOR DELETE USING (
        id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Workspace members policies
CREATE POLICY "Workspace members can view workspace members" ON public.workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace admins can manage members" ON public.workspace_members
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Boards policies
CREATE POLICY "Workspace members can view boards" ON public.boards
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can create boards" ON public.boards
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        ) AND auth.uid() = created_by
    );

CREATE POLICY "Board creators and workspace admins can update boards" ON public.boards
    FOR UPDATE USING (
        auth.uid() = created_by OR
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Board creators and workspace admins can delete boards" ON public.boards
    FOR DELETE USING (
        auth.uid() = created_by OR
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Columns policies
CREATE POLICY "Workspace members can view columns" ON public.columns
    FOR SELECT USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can manage columns" ON public.columns
    FOR ALL USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

-- Tasks policies
CREATE POLICY "Workspace members can view tasks" ON public.tasks
    FOR SELECT USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        ) AND auth.uid() = created_by
    );

CREATE POLICY "Workspace members can update tasks" ON public.tasks
    FOR UPDATE USING (
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Task creators and workspace admins can delete tasks" ON public.tasks
    FOR DELETE USING (
        auth.uid() = created_by OR
        board_id IN (
            SELECT b.id FROM public.boards b
            JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role = 'admin'
        )
    );

-- Task comments policies
CREATE POLICY "Workspace members can view task comments" ON public.task_comments
    FOR SELECT USING (
        task_id IN (
            SELECT t.id FROM public.tasks t
            JOIN public.boards b ON t.board_id = b.id
            JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can create task comments" ON public.task_comments
    FOR INSERT WITH CHECK (
        task_id IN (
            SELECT t.id FROM public.tasks t
            JOIN public.boards b ON t.board_id = b.id
            JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        ) AND auth.uid() = user_id
    );

CREATE POLICY "Comment authors can update their comments" ON public.task_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Comment authors can delete their comments" ON public.task_comments
    FOR DELETE USING (auth.uid() = user_id);

-- User activities policies
CREATE POLICY "Users can view their own activities" ON public.user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create user activities" ON public.user_activities
    FOR INSERT WITH CHECK (true);

-- Down:
-- Drop all policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace admins can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace admins can delete workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can manage members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace members can view boards" ON public.boards;
DROP POLICY IF EXISTS "Workspace members can create boards" ON public.boards;
DROP POLICY IF EXISTS "Board creators and workspace admins can update boards" ON public.boards;
DROP POLICY IF EXISTS "Board creators and workspace admins can delete boards" ON public.boards;
DROP POLICY IF EXISTS "Workspace members can view columns" ON public.columns;
DROP POLICY IF EXISTS "Workspace members can manage columns" ON public.columns;
DROP POLICY IF EXISTS "Workspace members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workspace members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workspace members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task creators and workspace admins can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workspace members can view task comments" ON public.task_comments;
DROP POLICY IF EXISTS "Workspace members can create task comments" ON public.task_comments;
DROP POLICY IF EXISTS "Comment authors can update their comments" ON public.task_comments;
DROP POLICY IF EXISTS "Comment authors can delete their comments" ON public.task_comments;
DROP POLICY IF EXISTS "Users can view their own activities" ON public.user_activities;
DROP POLICY IF EXISTS "System can create user activities" ON public.user_activities;
