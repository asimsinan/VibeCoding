-- Kanban Project Management Database Schema
-- This schema defines the database structure for the Kanban application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (managed by Supabase Auth)
-- This table is automatically created by Supabase Auth
-- We'll create a profiles table to extend user data

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
    description TEXT CHECK (length(description) <= 500),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Boards table
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
    description TEXT CHECK (length(description) <= 500),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Columns table
CREATE TABLE IF NOT EXISTS public.columns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 50),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
    description TEXT CHECK (length(description) <= 2000),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    column_id UUID REFERENCES public.columns(id) ON DELETE CASCADE NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity table
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL CHECK (action IN (
        'task_created', 'task_updated', 'task_moved', 'task_assigned', 'task_completed',
        'board_created', 'board_updated', 'workspace_joined', 'workspace_left'
    )),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'board', 'workspace', 'user')),
    entity_id UUID NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON public.workspaces(created_by);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_workspace_id ON public.boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_boards_created_by ON public.boards(created_by);
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON public.columns(board_id);
CREATE INDEX IF NOT EXISTS idx_columns_position ON public.columns(board_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON public.tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON public.tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(column_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_entity ON public.user_activities(entity_type, entity_id);

-- Row Level Security (RLS) Policies

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

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_columns_updated_at BEFORE UPDATE ON public.columns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON public.task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default columns when a board is created
CREATE OR REPLACE FUNCTION create_default_columns()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.columns (title, board_id, position) VALUES
        ('To Do', NEW.id, 0),
        ('In Progress', NEW.id, 1),
        ('Done', NEW.id, 2);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_default_columns_trigger
    AFTER INSERT ON public.boards
    FOR EACH ROW EXECUTE FUNCTION create_default_columns();

-- Function to automatically add workspace creator as admin member
CREATE OR REPLACE FUNCTION add_workspace_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER add_workspace_creator_as_admin_trigger
    AFTER INSERT ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION add_workspace_creator_as_admin();
