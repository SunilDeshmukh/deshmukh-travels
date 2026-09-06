require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

client.content.v1.contents.list()
  .then(contents => {
    if (contents.length === 0) {
      console.log('No templates found on this account');
      return;
    }
    contents.forEach(c => {
      console.log('SID:  ', c.sid);
      console.log('Name: ', c.friendlyName);
      console.log('---');
    });
  })
  .catch(err => console.error('Error:', err.message));