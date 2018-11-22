
const bot = require('./bot');
const Logic = require('./logic').logic;

const logic =  new Logic(bot);
logic.start();