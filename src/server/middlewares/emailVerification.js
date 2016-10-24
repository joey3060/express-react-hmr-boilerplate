import nev from '../utils/emailVerification';

const emailVerification = (req, res, next) => {
  let url = req.params.URL;
  nev.confirmTempUser(url, function(err, user) {
    console.log('user is', user);
    if (user) {
      nev.sendConfirmationEmail(user.email, function(err, info) {
        if (err) {
          return res.status(404).send('ERROR: sending confirmation email FAILED');
        }
        req.user = user;
        next();
      });
    } else {
      return res.status(404).send('ERROR: confirming temp user FAILED');
    }
  });
}

export default emailVerification;