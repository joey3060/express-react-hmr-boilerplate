import { handleDbError } from '../decorators/handleError';
import User from '../models/User';
import filterAttribute from '../utils/filterAttribute';
import nev from '../utils/emailVerification';
import nodemailer from 'nodemailer'

export default {
  create(req, res) {
    console.log('HELJEKFJDKLFJKLDJl');
    console.log('req', req);
    User.findOne({
      'email.value': req.body.email,
    }, handleDbError(res)((user) => {
      if (user !== null) {
        res.json({
          isError: true,
          errors: [{
            name: 'Duplicate Email',
            message: 'Email is already used',
          }],
        });
      } else {
        const user = User({
          name: req.body.name,
          email: {
            value: req.body.email,
          },
          password: req.body.password,
        });

        user.save(handleDbError(res)((user) => {
          res.json({
            user: user,
            isError: false,
          });
        }));
      }
    }));
  },

  login(req, res) {
    User.findOne({
      'email.value': req.body.email,
    }, handleDbError(res)((user) => {
      if (!user) {
        res.json({
          isError: false,
          isAuth: false,
        });
      } else {
        user.auth(req.body.password, handleDbError(res)((isAuth) => {
          if (isAuth) {
            const token = user.toJwtToken();
            res.json({
              isError: false,
              isAuth: true,
              token: token,
              user: user,
            });
          } else {
            res.json({
              isError: false,
              isAuth: false,
            });
          }
        }));
      }
    }));
  },

  logout(req, res) {
    req.logout();
    res.json({
      isError: false,
    });
  },

  show(req, res) {
    res.json({
      isError: false,
      user: req.user,
    });
  },

  update(req, res) {
    let user = filterAttribute(req.body, ['name', 'avatarURL']);
    User.update({ _id: req.user._id }, user, handleDbError(res)((raw) => {
      res.json({
        originAttributes: req.body,
        updatedAttributes: user,
        isError: false,
      });
    }));
  },

  uploadAvatar(req, res) {
    // use `req.file` to access the avatar file
    // and use `req.body` to access other fileds
    res.json({
      downloadURL: `/user/${req.user._id}/${req.file.filename}`,
      isError: false,
    });
  },

  verificationEmail(req, res) {
    let email = req.body.email;
    let newUser = User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    //
    // let smtpTransport = nodemailer.createTransport("SMTP",{
    //   service: "Gmail",
    //   auth: {
    //     user: "noreply@deeperience.com",
    //     pass: "123holisi",
    //   }
    // })
    //
    // rand = Math.floor((Math.random() * 100) + 87);
    // host=req.get('host');
    // link="http://"+req.get('host')+"/verify?id="+rand;
    // mailOptions={
    //   to : req.body.email,
    //   subject : "Please confirm your Email account",
    //   html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
    // }
    // console.log(mailOptions);
    // smtpTransport.sendMail(mailOptions, function(error, response){
    //   if(error){
    //     console.log(error);
    //     res.end("error");
    //   }else{
    //     console.log("Message sent: " + response.message);
    //     res.end("sent");
    //   }
    // });



    nev.createTempUser(newUser, function(err, existingPersistentUser, newTempUser) {
      if (err) {
        console.log(err);
        return res.status(404).send('ERROR: creating temp user FAILED');
      }

      // user already exists in persistent collection
      if (existingPersistentUser) {
        return res.json({
          msg: 'You have already signed up and confirmed your account. Did you forget your password?'
        });
      }

      // new user created
      if (newTempUser) {
        var URL = newTempUser[nev.options.URLFieldName];
        nev.sendVerificationEmail(email, URL, function(err, info) {
          if (err) {
            console.log(err);
            
            return res.status(404).send('ERROR: sending verification email FAILED');
          }
          res.json({
            msg: 'An email has been sent to you. Please check it to verify your account.',
            info: info
          });
        });

        // user already exists in temporary collection!
      } else {
        res.json({
          msg: 'You have already signed up. Please check your email to verify your account.'
        });
      }
    });

  },

};
