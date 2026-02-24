#!/bin/sh
set -e

echo "🚀 Starting Railway deployment setup..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until node -e "
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 10000
  }
});
sequelize.authenticate()
  .then(() => { console.log('✅ Database connected'); process.exit(0); })
  .catch(err => { console.error('❌ Database connection failed:', err.message); process.exit(1); });
" 2>/dev/null; do
  echo "Database not ready, waiting 2 seconds..."
  sleep 2
done

# Run migrations
echo "📦 Running database migrations..."
if node dist/scripts/run-migrations.js up 2>&1; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Migration warnings (tables may already exist)"
fi

# Seed initial data if needed
echo "🌱 Checking if initial data needs to be seeded..."
if node -e "
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  logging: false
});
sequelize.query('SELECT COUNT(*) as count FROM users', { type: 'SELECT' })
  .then(result => {
    if (result[0].count === 0) {
      console.log('No users found, seeding required');
      process.exit(0);
    } else {
      console.log('Users already exist, skipping seed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.log('Users table not found or error, will seed');
    process.exit(0);
  });
" 2>/dev/null; then
  echo "🌱 Seeding initial data..."
  if node dist/scripts/seed-database.js 2>&1; then
    echo "✅ Database seeded successfully"
  else
    echo "⚠️  Seeding warnings (data may already exist)"
  fi
else
  echo "✅ Database already has data, skipping seed"
fi

echo "🎉 Setup completed! Starting application..."
echo ""

# Start the application
exec node dist/server.js
