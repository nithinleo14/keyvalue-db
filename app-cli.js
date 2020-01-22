const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const inquirer = require('inquirer');
const db = require("./lib/keyvalue-db");

clear();

console.log(
  chalk.yellow(
    figlet.textSync('Key-Value DB', { horizontalLayout: 'full' })
  ) + "\n"
);

(async () => {
  let pathResult = await askFilePath()
  console.log(`success: ${pathResult.path} path set`);
  recursion();
})()

async function askFilePath() {
  const question = [
    {
      name: 'path',
      type: 'input',
      message: 'Please enter the file path',
      default: './db.json',
      validate: function (filepath = './db.json') {
        let data = db.setpath(filepath)
        if (!data.error) {
          return true
        }
        console.log(`\nerror: ${data.error}\n`)
      }
    }
  ];
  const x = await inquirer.prompt(question);
  return x;
}

const option = [
  {
    type: 'list',
    name: 'option',
    message: 'Please choose the option',
    choices: ['read', 'create', 'delete', 'exit'],
    validate: async function (value) {
      if (this.choices.includes(value)) {
        return true;
      }
      console.log('Please select the valid option')
    }
  }
];

function recursion() {
  inquirer.prompt(option)
    .then(async (x) => {
      if (x.option !== 'exit') {
        if (x.option == 'read') {
          let { key } = await getKey()
          let data = db.readkey(key)
          if (data.error) console.log(`error: ${data.error}`)
          else console.log(data)
        } else if (x.option == 'create') {
          let { key } = await getKey()
          let { value, timeout } = await getValue()
          if (parseInt(value)) {
            value = parseInt(value)
          }
          let data = db.createkey(key, value, timeout)
          if (data.error) console.log(`error: ${data.error}`)
          else console.log(data)
        } else if (x.option == 'delete') {
          let { key } = await getKey()
          let data = db.deletekey(key)
          if (data.error) console.log(`error: ${data.error}`)
          else console.log(data)
        }
        recursion();
      } else {
        console.log("Exiting appplication")
        return;
      }
    })
}

function getKey() {
  const key = [
    {
      name: 'key',
      type: 'input',
      message: 'Please enter the "key"',
      validate: function (value) {
        if (value.length) {
          return true;
        }
        console.log('\nPlease enter the valid key\n');
      }
    }
  ];
  return inquirer.prompt(key);
}

function getValue() {
  const value = [
    {
      name: 'value',
      type: 'input',
      message: 'Please enter the "value"',
      validate: function (value) {
        if (value.length) {
          return true;
        }
        console.log('\nPlease enter the valid value');
      }
    },
    {
      name: 'timeout',
      type: 'number',
      message: 'Please enter the "timeout" in sec.\nIf not input given default value 0 is assigned',
      default: 0,
      validate: function (value) {
        if (typeof value == 'number') {
          return true;
        }
        console.log('\nPlease enter the valid number');
      }
    }
  ];
  return inquirer.prompt(value);
}