# Install pgvector for PostgreSQL 17

## ✅ pgvector is built successfully!

Now you need to complete the installation manually (requires password):

```bash
cd /Users/asimsinanyuksel/Desktop/legal-assistant/pgvector
sudo make install PG_CONFIG="/opt/homebrew/Cellar/postgresql@17/17.6/bin/pg_config"
```

OR manually copy files to the RUNNING PostgreSQL (not Homebrew):

```bash
# Copy SQL files
sudo cp /Users/asimsinanyuksel/Desktop/legal-assistant/pgvector/sql/vector*.sql /Library/PostgreSQL/17/share/postgresql/extension/

# Copy control and meta files
sudo cp /Users/asimsinanyuksel/Desktop/legal-assistant/pgvector/vector.control /Library/PostgreSQL/17/share/postgresql/extension/
sudo cp /Users/asimsinanyuksel/Desktop/legal-assistant/pgvector/META.json /Library/PostgreSQL/17/share/postgresql/extension/

# Copy library
sudo cp /Users/asimsinanyuksel/Desktop/legal-assistant/pgvector/vector.dylib /Library/PostgreSQL/17/lib/
```

Then create the extension in your database:

```bash
/opt/homebrew/Cellar/postgresql@17/17.6/bin/psql postgresql://postgres:postgres@localhost:5432/legal_assistant -c "CREATE EXTENSION vector;"
```

Finally, update your schema:

```bash
npx prisma db push
npx prisma generate
```

## Running these commands:

1. **Install pgvector:**
   ```bash
   cd /Users/asimsinanyuksel/Desktop/legal-assistant/pgvector
   sudo make install PG_CONFIG="/opt/homebrew/Cellar/postgresql@17/17.6/bin/pg_config"
   ```

2. **Create extension:**
   ```bash
   psql postgresql://postgres:postgres@localhost:5432/legal_assistant -c "CREATE EXTENSION vector;"
   ```

3. **Update schema:**
   ```bash
   cd /Users/asimsinanyuksel/Desktop/legal-assistant
   npx prisma db push
   npx prisma generate
   ```

4. **Rebuild upload route to use native vectors:**
   After installation, embeddings will be stored natively in PostgreSQL using `vector(768)` type!

