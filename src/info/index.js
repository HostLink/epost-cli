const { GraphQLClient, gql } = require('graphql-request');
const Conf = require('conf');

const config = new Conf({ projectName: 'epost-cli' });
const ENDPOINT = 'https://app.e-post.com.hk/api/';

function getClient() {
  const token = config.get('token');
  if (!token) {
    console.error('No token found. Run `epost set-token <token>` first.');
    process.exit(1);
  }
  return new GraphQLClient(ENDPOINT, {
    headers: { Cookie: `access_token=${token}` },
  });
}

function register(program) {
  program
    .command('info')
    .description('Show account quota and expiry info')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const client = getClient();
      const query = gql`
        query {
          info {
            smsQuota {
              expiry_date
              quota
            }
            quota {
              expiry_date
              quota
            }
          }
        }
      `;
      try {
        const data = await client.request(query);
        const info = data?.info;
        if (options.json) {
          console.log(JSON.stringify(info, null, 2));
        } else {
          const eq = info?.quota;
          const sq = info?.smsQuota;
          console.log('=== Account Info ===');
          console.log('\nEmail Quota:');
          if (eq) {
            console.log(`  Quota      : ${eq.quota}`);
            console.log(`  Expiry Date: ${eq.expiry_date}`);
          } else {
            console.log('  No email quota info.');
          }
          console.log('\nSMS Quota:');
          if (sq) {
            console.log(`  Quota      : ${sq.quota}`);
            console.log(`  Expiry Date: ${sq.expiry_date}`);
          } else {
            console.log('  No SMS quota info.');
          }
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to fetch account info: ${message}`);
        process.exit(1);
      }
    });
}

module.exports = { register };
