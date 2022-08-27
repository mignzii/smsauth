const express = require("express");
const app = express();
var cors = require("cors");
var mysql = require("mysql");

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



app.post("/mail", (req, res) => {
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
          res.status(200).send("true");
        }
      }
    );
  }
});
app.patch("/voter", (req, reponse) => {
  let voixpresi = req.body.choixpresi;
  let voixpresiorga = req.body.choixpresiorga;
  let voixpresirelation = req.body.REX;
  let voixpresipeda = req.body.Peda;
  let voixSg = req.body.SG;
  let voixVP= req.body.VP;
  let VoixPresiculturel = req.body.CULTUREL;
  let voixtresorier= req.body.Treso;
  let emailvotant = req.body.emailelecteur;
  if (emailvotant != null) {
    connection.query("Select * from electeur  WHERE mail=? AND nbrefois=0",emailvotant,
      (err, resulta) => {
        if (err) console.log(err);
        else if (resulta.length == 0) {
          reponse.status(200).json({message:"Ce mail n'est pas valide pour voter"});
        } else {
          connection.query(`UPDATE candidat SET voix=voix+1 where id=${voixpresi} OR id=${voixpresiorga} OR id=${voixpresirelation} OR id=${voixpresipeda} OR id=${voixSg} OR id=${voixVP} OR id=${VoixPresiculturel} OR id=${voixtresorier}`,(err, result) => {
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
  connection.query('SELECT COUNT(*) FROM electeur WHERE nbrefois=1',(err,result)=>{
    if(!err){
      res.send(result)
    }else res.send(false)
  })
})

app.listen(PORT, () => {
  console.log("Serveur à l'écoute");
});
