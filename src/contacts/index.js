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
  const contacts = program.command('contacts').description('Manage contacts');

  contacts
    .command('list')
    .description('List contacts')
    .option('-g, --group <id>', 'Filter by contact group ID')
    .option('-l, --limit <n>', 'Max number of contacts to return', '50')
    .option('-o, --offset <n>', 'Number of contacts to skip', '0')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const client = getClient();

      const filters = options.group ? `filters: { contactgroup_id: ${parseInt(options.group)} }` : '';
      const pagination = `limit: ${parseInt(options.limit)}, offset: ${parseInt(options.offset)}`;

      const query = gql`
        query {
          listContact${filters ? `(${filters})` : ''} {
            data(${pagination}) {
              contact_id
              email
              name
              phone
            }
          }
        }
      `;

      try {
        const data = await client.request(query);
        const list = data?.listContact?.data ?? [];
        if (options.json) {
          console.log(JSON.stringify(list, null, 2));
        } else if (list.length === 0) {
          console.log('No contacts found.');
        } else {
          list.forEach(c => console.log(`[${c.contact_id}] ${c.name} | ${c.email} | ${c.phone}`));
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to fetch contacts: ${message}`);
        process.exit(1);
      }
    });

  contacts
    .command('add <name>')
    .description('Add a new contact')
    .requiredOption('-g, --group <id>', 'Contact group ID')
    .option('-e, --email <email>', 'Email address')
    .option('-p, --phone <phone>', 'Phone number')
    .action(async (name, options) => {
      const client = getClient();

      const fields = [
        `name: ${JSON.stringify(name)}`,
        `contactgroup_id: ${parseInt(options.group)}`,
        options.email ? `email: ${JSON.stringify(options.email)}` : null,
        options.phone ? `phone: ${JSON.stringify(options.phone)}` : null,
      ].filter(Boolean).join(', ');

      const mutation = gql`
        mutation {
          addContact(data: { ${fields} })
        }
      `;

      try {
        const data = await client.request(mutation);
        const id = data?.addContact;
        console.log(`Created: [${id}] ${name}`);
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to add contact: ${message}`);
        process.exit(1);
      }
    });
  contacts
    .command('delete <id>')
    .description('Delete a contact by ID')
    .action(async (id) => {
      const client = getClient();
      const mutation = gql`
        mutation {
          deleteContact(id: ${parseInt(id)})
        }
      `;
      try {
        const data = await client.request(mutation);
        if (data?.deleteContact) {
          console.log(`Deleted contact [${id}].`);
        } else {
          console.error('Delete failed.');
          process.exit(1);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to delete contact: ${message}`);
        process.exit(1);
      }
    });
}

module.exports = { register };
