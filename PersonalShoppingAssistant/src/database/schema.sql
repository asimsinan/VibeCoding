-- Personal Shopping Assistant Database Schema
-- TASK-005: Schema Design - FR-001 through FR-007
-- 
-- This schema defines the complete database structure for the Personal Shopping Assistant
-- including all tables, indexes, constraints, and relationships.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
-- FR-007: System MUST support user authentication and profile management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_password_hash_check CHECK (LENGTH(password_hash) >= 60)
);

-- User preferences table
-- FR-001: System MUST allow users to create and manage personal preference profiles
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    categories TEXT[] DEFAULT '{}',
    price_range_min DECIMAL(10,2) DEFAULT 0 CHECK (price_range_min >= 0),
    price_range_max DECIMAL(10,2) DEFAULT 1000 CHECK (price_range_max >= price_range_min),
    brands TEXT[] DEFAULT '{}',
    style_preferences TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT user_preferences_categories_check CHECK (ARRAY_LENGTH(categories, 1) IS NULL OR ARRAY_LENGTH(categories, 1) <= 20),
    CONSTRAINT user_preferences_brands_check CHECK (ARRAY_LENGTH(brands, 1) IS NULL OR ARRAY_LENGTH(brands, 1) <= 20),
    CONSTRAINT user_preferences_style_check CHECK (ARRAY_LENGTH(style_preferences, 1) IS NULL OR ARRAY_LENGTH(style_preferences, 1) <= 10)
);

-- Products table
-- FR-006: System MUST display product information including images, descriptions, prices, and availability
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    image_url VARCHAR(500),
    availability BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT products_name_check CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT products_description_check CHECK (LENGTH(description) <= 2000),
    CONSTRAINT products_price_check CHECK (price >= 0 AND price <= 999999.99),
    CONSTRAINT products_category_check CHECK (LENGTH(category) >= 1 AND LENGTH(category) <= 100),
    CONSTRAINT products_brand_check CHECK (LENGTH(brand) >= 1 AND LENGTH(brand) <= 100),
    CONSTRAINT products_image_url_check CHECK (image_url IS NULL OR (image_url ~* '^https?://' AND LENGTH(image_url) <= 500))
);

-- Interactions table
-- FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('view', 'like', 'dislike', 'purchase')),
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT interactions_metadata_check CHECK (jsonb_typeof(metadata) = 'object')
);

-- Recommendations table
-- FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
    algorithm VARCHAR(50) NOT NULL CHECK (algorithm IN ('collaborative', 'content-based', 'hybrid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Constraints
    CONSTRAINT recommendations_expires_at_check CHECK (expires_at > created_at)
);

-- Create indexes for performance optimization

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- User preferences table indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_categories ON user_preferences USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_user_preferences_brands ON user_preferences USING GIN(brands);
CREATE INDEX IF NOT EXISTS idx_user_preferences_price_range ON user_preferences(price_range_min, price_range_max);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Full-text search index for products
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Trigram index for fuzzy text search
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING gin(description gin_trgm_ops);

-- Interactions table indexes
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_product_id ON interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_interactions_user_type ON interactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_interactions_product_type ON interactions(product_id, type);
CREATE INDEX IF NOT EXISTS idx_interactions_user_timestamp ON interactions(user_id, timestamp DESC);

-- Recommendations table indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_product_id ON recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON recommendations(score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_algorithm ON recommendations(algorithm);
CREATE INDEX IF NOT EXISTS idx_recommendations_expires_at ON recommendations(expires_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_score ON recommendations(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_expires ON recommendations(user_id, expires_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category_price ON products(category, price);
CREATE INDEX IF NOT EXISTS idx_products_brand_availability ON products(brand, availability);
CREATE INDEX IF NOT EXISTS idx_products_category_availability ON products(category, availability);
CREATE INDEX IF NOT EXISTS idx_products_price_availability ON products(price, availability);

-- Create functions for automatic timestamp updates

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for data validation and business logic

-- Function to validate email format
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Function to get user interaction statistics
CREATE OR REPLACE FUNCTION get_user_interaction_stats(p_user_id INTEGER)
RETURNS TABLE(
    total_views BIGINT,
    total_likes BIGINT,
    total_dislikes BIGINT,
    total_purchases BIGINT,
    total_interactions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN type = 'view' THEN 1 END) as total_views,
        COUNT(CASE WHEN type = 'like' THEN 1 END) as total_likes,
        COUNT(CASE WHEN type = 'dislike' THEN 1 END) as total_dislikes,
        COUNT(CASE WHEN type = 'purchase' THEN 1 END) as total_purchases,
        COUNT(*) as total_interactions
    FROM interactions 
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get product popularity score
CREATE OR REPLACE FUNCTION get_product_popularity_score(p_product_id INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    view_count BIGINT;
    like_count BIGINT;
    purchase_count BIGINT;
    popularity_score DECIMAL;
BEGIN
    SELECT 
        COUNT(CASE WHEN type = 'view' THEN 1 END),
        COUNT(CASE WHEN type = 'like' THEN 1 END),
        COUNT(CASE WHEN type = 'purchase' THEN 1 END)
    INTO view_count, like_count, purchase_count
    FROM interactions 
    WHERE product_id = p_product_id;
    
    -- Calculate popularity score: views * 0.1 + likes * 0.3 + purchases * 0.6
    popularity_score := (view_count * 0.1) + (like_count * 0.3) + (purchase_count * 0.6);
    
    RETURN COALESCE(popularity_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM recommendations WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create views for common queries

-- View for user profiles with preferences
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.updated_at,
    up.categories,
    up.price_range_min,
    up.price_range_max,
    up.brands,
    up.style_preferences
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id;

-- View for product statistics
CREATE OR REPLACE VIEW product_stats AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.brand,
    p.price,
    p.availability,
    COUNT(i.id) as total_interactions,
    COUNT(CASE WHEN i.type = 'view' THEN 1 END) as view_count,
    COUNT(CASE WHEN i.type = 'like' THEN 1 END) as like_count,
    COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislike_count,
    COUNT(CASE WHEN i.type = 'purchase' THEN 1 END) as purchase_count,
    get_product_popularity_score(p.id) as popularity_score
FROM products p
LEFT JOIN interactions i ON p.id = i.product_id
GROUP BY p.id, p.name, p.category, p.brand, p.price, p.availability;

-- View for active recommendations
CREATE OR REPLACE VIEW active_recommendations AS
SELECT 
    r.id,
    r.user_id,
    r.product_id,
    r.score,
    r.algorithm,
    r.created_at,
    r.expires_at,
    p.name as product_name,
    p.category as product_category,
    p.brand as product_brand,
    p.price as product_price,
    p.image_url as product_image_url
FROM recommendations r
JOIN products p ON r.product_id = p.id
WHERE r.expires_at > NOW() AND p.availability = true;

-- Create materialized view for recommendation performance
CREATE MATERIALIZED VIEW IF NOT EXISTS recommendation_performance AS
SELECT 
    algorithm,
    COUNT(*) as total_recommendations,
    AVG(score) as avg_score,
    COUNT(CASE WHEN score > 0.8 THEN 1 END) as high_score_count,
    COUNT(CASE WHEN score < 0.3 THEN 1 END) as low_score_count
FROM recommendations
WHERE expires_at > NOW()
GROUP BY algorithm;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_recommendation_performance_algorithm ON recommendation_performance(algorithm);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_recommendation_performance()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW recommendation_performance;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO shopping_assistant_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO shopping_assistant_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO shopping_assistant_user;

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts and authentication data';
COMMENT ON TABLE user_preferences IS 'User shopping preferences and profile data';
COMMENT ON TABLE products IS 'Product catalog with details and availability';
COMMENT ON TABLE interactions IS 'User interactions with products for recommendation learning';
COMMENT ON TABLE recommendations IS 'Cached recommendation results for performance';

COMMENT ON COLUMN users.email IS 'Unique email address for user authentication';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN user_preferences.categories IS 'Array of preferred product categories';
COMMENT ON COLUMN user_preferences.price_range_min IS 'Minimum preferred price';
COMMENT ON COLUMN user_preferences.price_range_max IS 'Maximum preferred price';
COMMENT ON COLUMN user_preferences.brands IS 'Array of preferred brands';
COMMENT ON COLUMN user_preferences.style_preferences IS 'Array of style preferences';
COMMENT ON COLUMN products.name IS 'Product name';
COMMENT ON COLUMN products.description IS 'Product description';
COMMENT ON COLUMN products.price IS 'Product price in decimal format';
COMMENT ON COLUMN products.category IS 'Product category';
COMMENT ON COLUMN products.brand IS 'Product brand';
COMMENT ON COLUMN products.image_url IS 'URL to product image';
COMMENT ON COLUMN products.availability IS 'Whether product is currently available';
COMMENT ON COLUMN interactions.type IS 'Type of interaction: view, like, dislike, purchase';
COMMENT ON COLUMN interactions.metadata IS 'Additional interaction metadata as JSON';
COMMENT ON COLUMN recommendations.score IS 'Recommendation confidence score (0-1)';
COMMENT ON COLUMN recommendations.algorithm IS 'Algorithm used: collaborative, content-based, hybrid';
COMMENT ON COLUMN recommendations.expires_at IS 'When recommendation expires and should be refreshed';
