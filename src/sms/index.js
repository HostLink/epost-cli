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
  const sms = program.command('sms').description('Manage SMS');

  sms
    .command('list')
    .description('List sent SMS messages')
    .option('-l, --limit <n>', 'Max number of results to return', '50')
    .option('-o, --offset <n>', 'Number of results to skip', '0')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const client = getClient();
      const pagination = `limit: ${parseInt(options.limit)}, offset: ${parseInt(options.offset)}`;
      const query = gql`
        query {
          listSMS {
            data(${pagination}) {
              sms_id
              phone
              content
              no_of_msg
              created_time
              receive_time
              receive_status
              report_time
            }
          }
        }
      `;
      try {
        const data = await client.request(query);
        const list = data?.listSMS?.data ?? [];
        if (options.json) {
          console.log(JSON.stringify(list, null, 2));
        } else if (list.length === 0) {
          console.log('No SMS records found.');
        } else {
          list.forEach(s =>
            console.log(`[${s.sms_id}] ${s.phone} | ${s.content} | status: ${s.receive_status ?? 'N/A'} | created: ${s.created_time}`)
          );
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to fetch SMS list: ${message}`);
        process.exit(1);
      }
    });

  sms
    .command('get <id>')
    .description('Get an SMS record by ID')
    .option('--json', 'Output as JSON')
    .action(async (id, options) => {
      const client = getClient();
      const query = gql`
        query {
          listSMS(filters: { sms_id: ${parseInt(id)} }) {
            data {
              sms_id
              phone
              content
              no_of_msg
              created_time
              receive_time
              receive_status
              report_time
            }
          }
        }
      `;
      try {
        const data = await client.request(query);
        const list = data?.listSMS?.data ?? [];
        if (list.length === 0) {
          console.error(`SMS [${id}] not found.`);
          process.exit(1);
        }
        const s = list[0];
        if (options.json) {
          console.log(JSON.stringify(s, null, 2));
        } else {
          console.log(`[${s.sms_id}] ${s.phone} | ${s.content} | status: ${s.receive_status ?? 'N/A'} | created: ${s.created_time}`);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to fetch SMS: ${message}`);
        process.exit(1);
      }
    });

  sms
    .command('send <phone>')
    .description('Send an SMS to a phone number')
    .requiredOption('-c, --content <content>', 'SMS content')
    .action(async (phone, options) => {
      const client = getClient();
      const mutation = gql`
        mutation {
          sendSMS(phone: ${JSON.stringify(phone)}, content: ${JSON.stringify(options.content)})
        }
      `;
      try {
        const data = await client.request(mutation);
        const id = data?.sendSMS;
        console.log(`SMS sent. ID: ${id}`);
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to send SMS: ${message}`);
        process.exit(1);
      }
    });
}

module.exports = { register };
