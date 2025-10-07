-- Migration: 003 triggers_functions

-- Up:
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

-- Function to log user activities
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_action TEXT;
    activity_entity_type TEXT;
    activity_entity_id UUID;
    activity_details JSONB;
BEGIN
    -- Determine action and entity type based on operation
    IF TG_OP = 'INSERT' THEN
        activity_action := CASE TG_TABLE_NAME
            WHEN 'tasks' THEN 'task_created'
            WHEN 'boards' THEN 'board_created'
            WHEN 'workspaces' THEN 'workspace_joined'
            ELSE 'unknown_created'
        END;
        
        activity_entity_type := CASE TG_TABLE_NAME
            WHEN 'tasks' THEN 'task'
            WHEN 'boards' THEN 'board'
            WHEN 'workspaces' THEN 'workspace'
            ELSE 'unknown'
        END;
        
        activity_entity_id := NEW.id;
        activity_details := to_jsonb(NEW);
        
    ELSIF TG_OP = 'UPDATE' THEN
        activity_action := CASE TG_TABLE_NAME
            WHEN 'tasks' THEN 'task_updated'
            WHEN 'boards' THEN 'board_updated'
            ELSE 'unknown_updated'
        END;
        
        activity_entity_type := CASE TG_TABLE_NAME
            WHEN 'tasks' THEN 'task'
            WHEN 'boards' THEN 'board'
            ELSE 'unknown'
        END;
        
        activity_entity_id := NEW.id;
        activity_details := jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        );
        
    ELSIF TG_OP = 'DELETE' THEN
        activity_action := CASE TG_TABLE_NAME
            WHEN 'workspaces' THEN 'workspace_left'
            ELSE 'unknown_deleted'
        END;
        
        activity_entity_type := CASE TG_TABLE_NAME
            WHEN 'workspaces' THEN 'workspace'
            ELSE 'unknown'
        END;
        
        activity_entity_id := OLD.id;
        activity_details := to_jsonb(OLD);
    END IF;
    
    -- Insert activity record
    INSERT INTO public.user_activities (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        COALESCE(NEW.created_by, OLD.created_by, auth.uid()),
        activity_action,
        activity_entity_type,
        activity_entity_id,
        activity_details
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create activity logging triggers
CREATE TRIGGER log_task_activity
    AFTER INSERT OR UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER log_board_activity
    AFTER INSERT OR UPDATE ON public.boards
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER log_workspace_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

-- Down:
-- Drop triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON public.workspaces;
DROP TRIGGER IF EXISTS update_boards_updated_at ON public.boards;
DROP TRIGGER IF EXISTS update_columns_updated_at ON public.columns;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS update_task_comments_updated_at ON public.task_comments;
DROP TRIGGER IF EXISTS create_default_columns_trigger ON public.boards;
DROP TRIGGER IF EXISTS add_workspace_creator_as_admin_trigger ON public.workspaces;
DROP TRIGGER IF EXISTS log_task_activity ON public.tasks;
DROP TRIGGER IF EXISTS log_board_activity ON public.boards;
DROP TRIGGER IF EXISTS log_workspace_activity ON public.workspaces;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS create_default_columns();
DROP FUNCTION IF EXISTS add_workspace_creator_as_admin();
DROP FUNCTION IF EXISTS log_user_activity();
