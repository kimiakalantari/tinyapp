// REQUIREMENTS

const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['KIMIA'],
  maxAge: 24 * 60 * 60 * 1000,
}))

// FUNCTIONS AND OBJECTS

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
}

// Returns an object of short URLs specific to the passed in userID
const urlsForUser = function(id, urlDatabase) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "wutang"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "yrnatl"}
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
};

// METHODS

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser((req.session.user_id),urlDatabase), user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  if (!req.session.user_id) {
    res.send("Please login or register first!");
  } else {
    const randomShort = generateRandomString();
    urlDatabase[randomShort] = {longURL: req.body.longURL, userID: req.session.user_id};
    res.redirect('http://localhost:8080/urls/' + String(randomShort));
  }
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  if (!(Object.keys(urlDatabase).includes(req.params.id))) {
    res.send(404, "Invalid Short URL");
  } else if (!req.session.user_id || req.session.user_id !==  urlDatabase[req.params.id].userID) {
    res.send(404, "You are not logged in or do not have permission to access short url page.");
  } else {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, urlUserID: urlDatabase[req.params.id].userID, user: users[req.session.user_id]};
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  if (!(Object.keys(urlDatabase).includes(req.params.id))) {
    res.send(404, "Invalid Short URL");
  } else if (!req.session.user_id || req.session.user_id !==  urlDatabase[req.params.id].userID) {
    res.send(404, "You are not logged in or do not have permission to access short url page.");
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (!(Object.keys(urlDatabase).includes(req.params.id))) {
    res.send(404, "Invalid Short URL");
  } else if (!req.session.user_id || req.session.user_id !==  urlDatabase[req.params.id].userID) {
    res.send(404, "You are not logged in or do not have permission to access short url page.");
  } else {
    const shortURL = req.params.id;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});


//GO TO SPECIFIC LONG URL DIRECTLY
app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const fullURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(fullURL);
  } else {
    res.sendStatus(404);
    res.send('Invalid Short URL');
  }
});

//USER AUTHENTICATION
//REGISTER

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("register_index", templateVars);
});

app.post("/register", (req, res) => {
  const emailDuplicate = emailDupeChecker(req.body.email);
  if (emailDuplicate) {
    res.send(400, "An account already exists for this email address");
  } else {
    if (req.body.email && req.body.password) {
      let userID = generateRandomString();
      users[userID] = {
        id: userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      };
      req.session.user_id = userID;
      res.redirect("/urls");
    } else {
      res.send(400, "Please include both a valid email and password");
    }
  }
});

//LOGIN

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id], };
  res.render("login_index", templateVars);
});

app.post("/login", (req, res) => {
  let userEmail = "";
  let userPass = "";

  for (let x in users) {
    if (users[x]['email'] === req.body.email && bcrypt.compareSync(req.body.password, users[x]['password'])) {
      userEmail = req.body.email;
      userPass = req.body.password;
      req.session.user_id = users[x]["id"];
    }
  }
  if (userEmail.length > 0 && userPass.length > 0) {
    res.redirect('/urls');
  } else {
    res.send(403, "Invalid email or password");
  }
});

//LOGOUT

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect('/login');
});

//LISTEN TO PORT

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});