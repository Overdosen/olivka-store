import { execSync } from 'child_process';

const merchantId = '5774679836';
const connectionId = '69eb73be0fdd4707beb7cb25';
const actionId = '6976672484c4e21ccc8d65e6';

try {
  const input = JSON.stringify({ merchantId }).replace(/"/g, '\\"');
  const command = `membrane action run ${actionId} --connectionId ${connectionId} --input "${input}" --json`;
  console.log('Running:', command);
  const result = execSync(command, { encoding: 'utf-8' });
  console.log('RESULT:', result);
} catch (error) {
  console.error('ERROR:', error.stdout || error.message);
}
