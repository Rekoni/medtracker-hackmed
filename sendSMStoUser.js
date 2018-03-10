const Nexmo = require('nexmo');
const nexmo = new Nexmo({
  apiKey: '78df2e80',
  apiSecret: 'aM8o9QE50I9PZJ7Q'
});

nexmo.message.sendSms(
  '447418340454', userNumber, userMessage,
    (err, responseData) => {
      if (err) {
        console.log(err);
      } else {
        console.dir(responseData);
      }
    }
 );

//userNumber, userMessage - must be strings
