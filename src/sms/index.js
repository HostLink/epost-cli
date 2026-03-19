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
