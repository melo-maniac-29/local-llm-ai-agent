const { execSync } = require('child_process');

console.log('Regenerating Convex API client...');
try {
  execSync('npx convex dev --once', { stdio: 'inherit' });
  console.log('API client regenerated successfully!');
} catch (error) {
  console.error('Error regenerating API client:', error);
}
