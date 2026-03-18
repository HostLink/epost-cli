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
  const groups = program.command('groups').description('Manage contact groups');

  groups
    .command('list')
    .description('List all contact groups')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const client = getClient();
      const query = gql`
        query {
          listContactGroup {
            data {
              contactgroup_id
              name
            }
          }
        }
      `;
      try {
        const data = await client.request(query);
        const list = data?.listContactGroup?.data ?? [];
        if (options.json) {
          console.log(JSON.stringify(list, null, 2));
        } else if (list.length === 0) {
          console.log('No contact groups found.');
        } else {
          list.forEach(g => console.log(`[${g.contactgroup_id}] ${g.name}`));
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to fetch contact groups: ${message}`);
        process.exit(1);
      }
    });

  groups
    .command('add <name>')
    .description('Add a new contact group')
    .action(async (name) => {
      const client = getClient();
      const mutation = gql`
        mutation {
          addContactGroup(data: { name: ${JSON.stringify(name)} })
        }
      `;
      try {
        const data = await client.request(mutation);
        const id = data?.addContactGroup;
        console.log(`Created: [${id}] ${name}`);
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to add contact group: ${message}`);
        process.exit(1);
      }
    });

  groups
    .command('delete <id>')
    .description('Delete a contact group by ID')
    .action(async (id) => {
      const client = getClient();
      const mutation = gql`
        mutation {
          deleteContactGroup(id: ${parseInt(id)})
        }
      `;
      try {
        const data = await client.request(mutation);
        if (data?.deleteContactGroup) {
          console.log(`Deleted contact group [${id}].`);
        } else {
          console.error('Delete failed.');
          process.exit(1);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to delete contact group: ${message}`);
        process.exit(1);
      }
    });
}

module.exports = { register };
