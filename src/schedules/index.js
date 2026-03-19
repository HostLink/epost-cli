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
  const schedules = program.command('schedules').description('Manage schedules');

  schedules
    .command('list')
    .description('List schedules')
    .option('-l, --limit <n>', 'Max number of schedules to return', '50')
    .option('-o, --offset <n>', 'Number of schedules to skip', '0')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const client = getClient();
      const pagination = `limit: ${parseInt(options.limit)}, offset: ${parseInt(options.offset)}`;
      const query = gql`
        query {
          listSchedule {
            data(${pagination}) {
              schedule_id
              letter_id
              date
              time
              sender_name
              sender_email
              reply_to_name
              reply_to
            }
          }
        }
      `;
      try {
        const data = await client.request(query);
        const list = data?.listSchedule?.data ?? [];
        if (options.json) {
          console.log(JSON.stringify(list, null, 2));
        } else if (list.length === 0) {
          console.log('No schedules found.');
        } else {
          list.forEach(s =>
            console.log(`[${s.schedule_id}] letter:${s.letter_id} | ${s.time} | ${s.sender_name} <${s.sender_email}>`)
          );
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to fetch schedules: ${message}`);
        process.exit(1);
      }
    });
  schedules
    .command('get <id>')
    .description('Get a schedule by ID')
    .option('--json', 'Output as JSON')
    .action(async (id, options) => {
      const client = getClient();
      const query = gql`
        query {
          listSchedule(filters: { schedule_id: ${parseInt(id)} }) {
            data {
              schedule_id
              letter_id
              date
              time
              sender_name
              sender_email
              reply_to_name
              reply_to
            }
          }
        }
      `;
      try {
        const data = await client.request(query);
        const list = data?.listSchedule?.data ?? [];
        if (list.length === 0) {
          console.error(`Schedule [${id}] not found.`);
          process.exit(1);
        }
        const s = list[0];
        if (options.json) {
          console.log(JSON.stringify(s, null, 2));
        } else {
          console.log(`[${s.schedule_id}] letter:${s.letter_id} | ${s.date} ${s.time} | ${s.sender_name} <${s.sender_email}>`);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to fetch schedule: ${message}`);
        process.exit(1);
      }
    });

  schedules
    .command('add')
    .description('Add a new schedule')
    .requiredOption('--letter <id>', 'Letter ID')
    .requiredOption('--date <date>', 'Send date (e.g. 2026-03-18)')
    .requiredOption('--time <time>', 'Send time (e.g. 16:00:00)')
    .requiredOption('--group <ids>', 'Contact group ID(s), comma-separated')
    .requiredOption('--sender-email <email>', 'Sender email')
    .option('--sender-name <name>', 'Sender name')
    .option('--reply-to <email>', 'Reply-to email')
    .option('--reply-to-name <name>', 'Reply-to name')
    .action(async (options) => {
      const client = getClient();
      const groupIds = options.group.split(',').map(id => parseInt(id.trim()));

      const fields = [
        `letter_id: ${parseInt(options.letter)}`,
        `date: ${JSON.stringify(options.date)}`,
        `time: ${JSON.stringify(options.time)}`,
        `contactgroup_id: [${groupIds.join(', ')}]`,
        `sender_email: ${JSON.stringify(options.senderEmail)}`,
        options.senderName   ? `sender_name: ${JSON.stringify(options.senderName)}`   : null,
        options.replyTo      ? `reply_to: ${JSON.stringify(options.replyTo)}`          : null,
        options.replyToName  ? `reply_to_name: ${JSON.stringify(options.replyToName)}` : null,
      ].filter(Boolean).join(', ');

      const mutation = gql`
        mutation {
          addSchedule(data: { ${fields} })
        }
      `;
      try {
        const data = await client.request(mutation);
        const id = data?.addSchedule;
        console.log(`Created schedule [${id}].`);
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to add schedule: ${message}`);
        process.exit(1);
      }
    });

  schedules
    .command('update <id>')
    .description('Update a schedule')
    .requiredOption('--letter <id>', 'Letter ID')
    .requiredOption('--date <date>', 'Send date (e.g. 2026-03-18)')
    .requiredOption('--time <time>', 'Send time (e.g. 16:00:00)')
    .requiredOption('--group <ids>', 'Contact group ID(s), comma-separated')
    .requiredOption('--sender-email <email>', 'Sender email')
    .option('--sender-name <name>', 'Sender name')
    .option('--reply-to <email>', 'Reply-to email')
    .option('--reply-to-name <name>', 'Reply-to name')
    .action(async (id, options) => {
      const client = getClient();
      const groupIds = options.group.split(',').map(i => parseInt(i.trim()));

      const fields = [
        `letter_id: ${parseInt(options.letter)}`,
        `date: ${JSON.stringify(options.date)}`,
        `time: ${JSON.stringify(options.time)}`,
        `contactgroup_id: [${groupIds.join(', ')}]`,
        `sender_email: ${JSON.stringify(options.senderEmail)}`,
        options.senderName   ? `sender_name: ${JSON.stringify(options.senderName)}`   : null,
        options.replyTo      ? `reply_to: ${JSON.stringify(options.replyTo)}`          : null,
        options.replyToName  ? `reply_to_name: ${JSON.stringify(options.replyToName)}` : null,
      ].filter(Boolean).join(', ');

      const mutation = gql`
        mutation {
          updateSchedule(id: ${parseInt(id)}, data: { ${fields} })
        }
      `;
      try {
        const data = await client.request(mutation);
        if (data?.updateSchedule) {
          console.log(`Updated schedule [${id}].`);
        } else {
          console.error('Update failed.');
          process.exit(1);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to update schedule: ${message}`);
        process.exit(1);
      }
    });

  schedules
    .command('delete <id>')
    .description('Delete a schedule by ID')
    .action(async (id) => {
      const client = getClient();
      const mutation = gql`
        mutation {
          deleteSchedule(id: ${parseInt(id)})
        }
      `;
      try {
        const data = await client.request(mutation);
        if (data?.deleteSchedule) {
          console.log(`Deleted schedule [${id}].`);
        } else {
          console.error('Delete failed.');
          process.exit(1);
        }
      } catch (err) {
        const message = err?.response?.errors?.[0]?.message ?? err.message;
        console.error(`Failed to delete schedule: ${message}`);
        process.exit(1);
      }
    });
}

module.exports = { register };
