#!/usr/bin/env node

const { Command } = require('commander');
const Conf = require('conf');
const groups = require('./src/groups');
const contacts = require('./src/contacts');
const letters = require('./src/letters');
const schedules = require('./src/schedules');
const sms = require('./src/sms');

const config = new Conf({ projectName: 'epost-cli' });

const program = new Command();

program
  .name('epost')
  .description('e-post CLI')
  .version('1.0.0');

program
  .command('set-token <token>')
  .description('Save your access token')
  .action((token) => {
    config.set('token', token);
    console.log('Token saved.');
  });

groups.register(program);
contacts.register(program);
letters.register(program);
schedules.register(program);
sms.register(program);

program.parse(process.argv);

