const express = require("express");
const app = express();
var cors = require("cors");
var mysql = require("mysql");
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey("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")


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

app.get("/participant", (req, res) => {
  connection.query("Select * from candidat ", (err, result) => {
    if (err) console.log(err);
    else {
      res.status(200).json(result);
    }
  });
});

app.post("/testmail", (req, res) => {
  let emailuser = req.body.mail;
  console.log(emailuser);
  if (emailuser == null) {
    res.status(200).send("false");
  } else {
    connection.query(
      "Select * from electeur  WHERE mail=? AND nbrefois=0",
      emailuser,
      (err, result) => {
        if (err) console.log(err);
        if (result.length == 0) {
          res.status(200).send("false");
        } else {
           res.status(200).send("true")

        }
      }
    );
  }
});

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

app.patch("/voter", (req, reponse) => {
  let voixpresi = req.body.choixpresi;
  let voixpresicompte = req.body.choixpresicompte;
  let emailvotant = req.body.emailelecteur;
  console.log(voixpresicompte)
  if (emailvotant != null) {
    connection.query("Select * from electeur  WHERE mail=? AND nbrefois=0",emailvotant,
      (err, resulta) => {
        if (err) console.log(err);
        else if (resulta.length == 0) {
          reponse.status(200).json({message:"Ce mail n'est pas valide pour voter"});
        } else {
          connection.query(`UPDATE candidat SET voix=voix+1 where id=${voixpresi} OR id=${voixpresicompte}  `,(err, result) => {
              if (err) console.log(err);
              else {
                console.log(resulta[0].mail)
                connection.query(`UPDATE electeur SET nbrefois=1 where mail="${resulta[0].mail}"`,(err,resultat)=>{
                    if(!err) {
                        reponse.status(200).json({message:'Bien mise a jour' }  )
                    }
                    else console.log(err)
                    
                })

              }
            }
          );
        }
      }
    );
  } else {
    reponse.status(400).json({message:"cet email ne vote pas "});
  }
});
app.get('/allvotant', (req,res)=>{
  connection.query('SELECT COUNT(*) as votant FROM electeur WHERE nbrefois=1',(err,result)=>{
    if(!err){
      res.send(result)
    }else res.send(false)
  })
})

app.listen(PORT, () => {
  console.log("Serveur à l'écoute");
});
