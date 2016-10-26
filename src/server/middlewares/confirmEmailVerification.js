import nev from '../utils/emailVerification';

const confirmEmailVerification = (req, res, next) => {
  let url = req.params.URL;
  nev.confirmVerificationEmail(url)
    .then((user) => {
      if (user) {
        const token = user.toJwtToken();
        res.cookie('token', token);
        res.cookie('user', JSON.stringify(user));
        res.redirect('/');
      } else {
        res.redirect('/');
      }
    })
    .catch((err) => {
      res.status(404).send('Confirm Verification Email Function FAILED');
    });
};

export default confirmEmailVerification;

