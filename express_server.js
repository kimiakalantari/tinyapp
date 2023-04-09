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
}));

// FUNCTIONS AND OBJECTS

const { generateRandomString, emailDupeChecker, userIdFromEmail, urlsForUser } = require("./helpers");

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
    res.status(401).send("Please login or register first!");
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
    res.status(404).send("Invalid Short URL");
  } else if (!req.session.user_id || req.session.user_id !==  urlDatabase[req.params.id].userID) {
    res.status(404).send("You are not logged in or do not have permission to access short url page.");
  } else {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, urlUserID: urlDatabase[req.params.id].userID, user: users[req.session.user_id]};
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  if (!(Object.keys(urlDatabase).includes(req.params.id))) {
    res.status(404, "Invalid Short URL");
  } else if (!req.session.user_id || req.session.user_id !==  urlDatabase[req.params.id].userID) {
    res.status(401).send("You are not logged in or do not have permission to access short url page.");
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (!(Object.keys(urlDatabase).includes(req.params.id))) {
    res.status(404).send("Invalid Short URL");
  } else if (!req.session.user_id || req.session.user_id !==  urlDatabase[req.params.id].userID) {
    res.status(401).send("You are not logged in or do not have permission to access short url page.");
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
    res.status(404).send('Invalid Short URL');
  }
});

//USER AUTHENTICATION
//REGISTER

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("register_index", templateVars);
});

app.post("/register", (req, res) => {
  const emailDuplicate = emailDupeChecker(req.body.email, users);
  if (emailDuplicate) {
    res.status(400).send("An account already exists for this email address");
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
      res.status(400).send("Please include both a valid email and password");
    }
  }
});

//LOGIN

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id], };
  res.render("login_index", templateVars);
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (emailDupeChecker(email)) {
    res.status(403).send("There is no account associated with this email address");
  } else {
    const userID = userIdFromEmail(email, users);
    if (!bcrypt.compareSync(password, users[userID].password)) {
      res.status(403).send("The password you entered does not match the one associated with the provided email address");
    } else {
      req.session.user_id = userID;
      res.redirect("/urls");
    }
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