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
  const delivery = program.command('delivery').description('Manage email deliveries');

  delivery
    .command('list')
    .description('List delivery records')
    .requiredOption('-s, --schedule <id>', 'Filter by schedule ID')
    .option('-l, --limit <n>', 'Max number of records to return', '50')
    .option('-o, --offset <n>', 'Number of records to skip', '0')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const client = getClient();
      const pagination = `limit: ${parseInt(options.limit)}, offset: ${parseInt(options.offset)}`;
      const query = gql`
        query {
          listDelivery(filters: { schedule_id: ${parseInt(options.schedule)} }) {
            meta { total }
            data(${pagination}) {
              delivery_id
              name
              email
              time
              letter_id
              viewed
              view_ip
              view_time
              statusLabel
              bounceCode
            }
          }
        }
      `;
      try {
        const data = await client.request(query);
        const list = data?.listDelivery?.data ?? [];
        const total = data?.listDelivery?.meta?.total ?? list.length;
        if (options.json) {
          console.log(JSON.stringify({ total, data: list }, null, 2));
        } else if (list.length === 0) {
          console.log('No delivery records found.');
        } else {
          list.forEach(d =>
            console.log(`[${d.delivery_id}] ${d.name} <${d.email}> | letter:${d.letter_id} | sent: ${d.time ?? 'N/A'} | ${d.statusLabel ?? 'N/A'} | viewed: ${d.viewed ? 'Yes' : 'No'}${d.view_time ? ` @ ${d.view_time}` : ''}${d.bounceCode ? ` | bounce: ${d.bounceCode}` : ''}`)
          );
          console.log(`\nTotal: ${total}`);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to fetch delivery records: ${message}`);
        process.exit(1);
      }
    });

  delivery
    .command('get <id>')
    .description('Get a delivery record by ID')
    .option('--json', 'Output as JSON')
    .action(async (id, options) => {
      const client = getClient();
      const query = gql`
        query {
          listDelivery(filters: { delivery_id: ${parseInt(id)} }) {
            data {
              delivery_id
              name
              email
              time
              letter_id
              viewed
              view_ip
              view_time
              statusLabel
              bounceCode
            }
          }
        }
      `;
      try {
        const data = await client.request(query);
        const list = data?.listDelivery?.data ?? [];
        if (list.length === 0) {
          console.error(`Delivery [${id}] not found.`);
          process.exit(1);
        }
        const d = list[0];
        if (options.json) {
          console.log(JSON.stringify(d, null, 2));
        } else {
          console.log(`[${d.delivery_id}] ${d.name} <${d.email}> | letter:${d.letter_id} | sent: ${d.time ?? 'N/A'} | ${d.statusLabel ?? 'N/A'} | viewed: ${d.viewed ? 'Yes' : 'No'}${d.view_time ? ` @ ${d.view_time}` : ''}${d.bounceCode ? ` | bounce: ${d.bounceCode}` : ''}`);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to fetch delivery: ${message}`);
        process.exit(1);
      }
    });
}

module.exports = { register };
