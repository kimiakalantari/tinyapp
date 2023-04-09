/* Generates a random string, used for creating short URLs and userIDs */
function generateRandomString() {
  const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += alphanumericChars.charAt(Math.floor(Math.random() * alphanumericChars.length));
  }
  return result;
}

/* Checks if given email corresponds to a user in a given database, returns true or false */
function emailDupeChecker(emailCheck, users) {
  let emailExists = false;
  for (let x in users) {
    if (users[x]['email'] === emailCheck.trim()) {
      emailExists = true;
      break;
    }
  }
  return emailExists;
}

/* Takes an email and userDatabase and returns the user ID for the user with the given email address */
const userIdFromEmail = function(email, database) {
  for (let user in database) {
    if (database[user]['email'] === email.trim()) {
      return database[user].id;
    }
  }
};

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

module.exports = {
  generateRandomString,
  emailDupeChecker,
  userIdFromEmail,
  urlsForUser
};