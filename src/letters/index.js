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
  const letters = program.command('letters').description('Manage letters');

  letters
    .command('list')
    .description('List letters')
    .option('-l, --limit <n>', 'Max number of letters to return', '50')
    .option('-o, --offset <n>', 'Number of letters to skip', '0')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const client = getClient();
      const pagination = `limit: ${parseInt(options.limit)}, offset: ${parseInt(options.offset)}`;
      const query = gql`
        query {
          listLetter {
            meta { total }
            data(${pagination}) {
              letter_id
              subject
              content
            }
          }
        }
      `;
      try {
        const data = await client.request(query);
        const list = data?.listLetter?.data ?? [];
        const total = data?.listLetter?.meta?.total ?? list.length;
        if (options.json) {
          console.log(JSON.stringify({ total, data: list }, null, 2));
        } else if (list.length === 0) {
          console.log('No letters found.');
        } else {
          list.forEach(l => console.log(`[${l.letter_id}] ${l.subject}`));
          console.log(`\nTotal: ${total}`);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to fetch letters: ${message}`);
        process.exit(1);
      }
    });

  letters
    .command('get <id>')
    .description('Get a letter by ID')
    .option('--json', 'Output as JSON')
    .action(async (id, options) => {
      const client = getClient();
      const query = gql`
        query {
          listLetter(filters: { letter_id: ${parseInt(id)} }) {
            data {
              letter_id
              subject
              content
            }
          }
        }
      `;
      try {
        const data = await client.request(query);
        const list = data?.listLetter?.data ?? [];
        if (list.length === 0) {
          console.error(`Letter [${id}] not found.`);
          process.exit(1);
        }
        const l = list[0];
        if (options.json) {
          console.log(JSON.stringify(l, null, 2));
        } else {
          console.log(`[${l.letter_id}] ${l.subject}\n${l.content}`);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to fetch letter: ${message}`);
        process.exit(1);
      }
    });

  letters
    .command('add <subject>')
    .description('Add a new letter')
    .requiredOption('-c, --content <content>', 'Letter content')
    .action(async (subject, options) => {
      const client = getClient();
      const mutation = gql`
        mutation {
          addLetter(data: { subject: ${JSON.stringify(subject)}, content: ${JSON.stringify(options.content)} })
        }
      `;
      try {
        const data = await client.request(mutation);
        const id = data?.addLetter;
        console.log(`Created: [${id}] ${subject}`);
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to add letter: ${message}`);
        process.exit(1);
      }
    });

  letters
    .command('update <id>')
    .description('Update a letter')
    .requiredOption('-s, --subject <subject>', 'Letter subject')
    .requiredOption('-c, --content <content>', 'Letter content')
    .action(async (id, options) => {
      const client = getClient();
      const mutation = gql`
        mutation {
          updateLetter(id: ${parseInt(id)}, data: { subject: ${JSON.stringify(options.subject)}, content: ${JSON.stringify(options.content)} })
        }
      `;
      try {
        const data = await client.request(mutation);
        if (data?.updateLetter) {
          console.log(`Updated letter [${id}].`);
        } else {
          console.error('Update failed.');
          process.exit(1);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to update letter: ${message}`);
        process.exit(1);
      }
    });

  letters
    .command('delete <id>')
    .description('Delete a letter by ID')
    .action(async (id) => {
      const client = getClient();
      const mutation = gql`
        mutation {
          deleteLetter(id: ${parseInt(id)})
        }
      `;
      try {
        const data = await client.request(mutation);
        if (data?.deleteLetter) {
          console.log(`Deleted letter [${id}].`);
        } else {
          console.error('Delete failed.');
          process.exit(1);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to delete letter: ${message}`);
        process.exit(1);
      }
    });
}

module.exports = { register };
