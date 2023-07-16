const express = require("express");
const app = express();
var cors = require("cors");
var mysql = require("mysql");
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const accountSid = 'AC9309cb851c918ba44a0323ec10a95da1';
const authToken = '9746a0b2300463be82fc1890b62e39af';
TWILIO_SERVICE_SID = "VAb4dc3daac06215ea8bc40a82afcd7184"
const client = twilio(accountSid, authToken);

// Configure Nodemailer with your email credentials
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'ibrahimaminianediouf@esp.sn',
    pass: 'ywjprnmqiauntcft',
  },
});

// Connection a la base de donée
var connection = mysql.createConnection({
  host: "mysql-electionageis.alwaysdata.net",
  user: "279238_test",
  password: "jeteste",
  database: "electionageis_election",
});
connection.connect((err) => {
  if (err) throw err;
  console.log("Connexion DB: OK");
});
const PORT =  process.env.PORT || 6001 ;

// Middelware pour conversion


//Generer un mot de passe aleatoire
const possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567';
const CodepossibleCaracter = '0123456789';

// Generate a random password of specified length
function generateRandomPassword(length) {
  let password = '';

  for (let i = 0; i < length; i++) {
    // Get a random character from the possibleCharacters string
    // and add it to the password string
    password += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
  }

  return password;
}

app.use(express.json());
app.use(cors());

// Pour envoyer sms avec twilio 
app.post('/sendSMS', async (req, res) => {
  const { countrycode, phoneNumber } = req.body;
  console.log(countrycode)
  console.log(phoneNumber)
  console.log(`+${countrycode}${phoneNumber}`)
  try {
    const otpResponse = await client.verify.services(TWILIO_SERVICE_SID)
      .verifications.create({
        to: `+${countrycode}${phoneNumber}`,
        channel: 'sms'
      });
    res.status(200).send(`OTP envoyé avec succès ! : ${JSON.stringify(otpResponse)}`);
  } catch (error) {
    res.status(error?.status || 400).send(error?.message || 'Quelque chose ne fonctionne pas');
  }
});

// Pour verifier le code 
app.post('/verifyOTP', async (req, res) => {
  const { countrycode, phoneNumber, code } = req.body;
  try {
    const verificationCheck = await client.verify.services(TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: `+${countrycode}${phoneNumber}`,
        code: code
      });
      
    if (verificationCheck.status === 'approved') {
      // Le code OTP est valide
      res.status(200).send('Code OTP valide');
    } else {
      // Le code OTP est invalide
      res.status(400).send('Code OTP invalide');
    }
  } catch (error) {
    res.status(error?.status || 400).send(error?.message || 'Quelque chose ne fonctionne pas');
  }
});

// verifier si l'utilisateur est dans la base de donéée 

app.post("/testmail", (req, res) => {
  let emailuser = req.body.mail;
  console.log(emailuser);
  if (emailuser == null) {
    res.status(200).send("false");
  } else {
    connection.query(
      "Select * from electeur WHERE mail=? AND nbrefois=0",
      emailuser,
      (err, result) => {
        if (err) console.log(err);
        if (result.length == 0) {
          console.log(result)
          console.log("la")
          res.status(200).send("false");
        } else {
          console.log(result[0].password)
          // l'email est valide , on crée alors un mot de passe `
          // Generate a random password of 10 characters
          if(result[0].password !='') {
            console.log(result.password)
            res.status(200).send("true")
          } else {
            console.log(result[0].password)
            console.log("Hello")
            const password = generateRandomPassword(6)   
            const mailOptions = {
             
              from: ' ibrahimaminianediouf@esp.sn',
              to: emailuser,
              subject: 'election',
              text: 'mot de passe ' +password,
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log(error);
                res.status(500).send('Error sending email');
              } else {
                console.log('Email sent: ' + info.response);
                connection.query(`UPDATE electeur SET password="${password}" where mail="${emailuser}"`,(err, result) =>{
                  if(err) console.log(err)
                  else {
                    res.status(200).send("true")
                  }
                  
                })
              }
            });
          }
       
        }
      }
    );
  }
});
 // Verifier le mot de passe 
app.post("/password", (req, res) => {
  let passworduser = req.body.password;
  console.log(passworduser);
  if (passworduser == null) {
    res.status(200).send("false");
  } else {
    connection.query(
      "Select * from electeur  WHERE password=? AND nbrefois=0",
      passworduser,
      (err, result) => {
        if (err) console.log(err);
        if (result.length == 0) {
          res.status(200).send("false");
        } else {
          // le mot de passe  est valide 
          res.status(200).send("true");
        }
      }
    );
  }
});


app.listen(PORT, () => {
  console.log("Serveur à l'écoute");
});