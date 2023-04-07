function generateRandomString() {
  const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += alphanumericChars.charAt(Math.floor(Math.random() * alphanumericChars.length));
  }
  return result;
}

function emailDupeChecker(emailCheck) {
  let emailExists = false;
  for (let x in users) {
    if (users[x]['email'] == emailCheck.trim()) {
      emailExists = true;
      break;
    }
  }
  return emailExists;
};

const express = require("express");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca"},
  "9sm5xK": {longURL: "http://www.google.com"}
};


const users = {
  "yrnatl": {
    id: "yrnatl",
    email: "migos@yungrichnation.com",
    password: "trap-funk"
  },
 "wutang": {
    id: "wutang",
    email: "36chambers@wutangclan.com",
    password: "da-mystery-of-chessboxin"
  }
}

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user_id: req.cookies["user_id"], user: users };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, user_id: req.cookies["user_id"], user: users };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const randomShort = generateRandomString();
  urlDatabase[randomShort] = {longURL: req.body.longURL}
  res.redirect('http://localhost:8080/urls/' + String(randomShort));
});

app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
  else {
    res.sendStatus(404);
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user_id: req.cookies["user_id"], user: users};
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"], user: users };
  res.render("register_index", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"], user: users };
  res.render("login_index", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = {longURL};
  res.redirect('/urls');
});

// app.post("/login", (req, res) => {
//   res.cookie("user_id", req.body.username);
//   res.redirect("/urls");
// });

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  const emailDuplicate = emailDupeChecker(req.body.email);
  if (emailDuplicate) {
    res.sendStatus(400);
  } else {
    if (req.body.email && req.body.password) {
      let userID = generateRandomString();
      users[userID] = {
        id: userID,
        email: req.body.email,
        password: req.body.password
      };
      res.cookie("user_id", userID);
      res.redirect("/urls");
    }
    else {
      res.sendStatus(400);
    }
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});