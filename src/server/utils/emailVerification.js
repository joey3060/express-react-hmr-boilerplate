import nodemailer from 'nodemailer';

function emailVerification() {
  let isPositiveInteger = function(x) {
    return ((parseInt(x, 10) === x) && (x >= 0));
  };

  let createOptionError = function(optionName, optionValue, expectedType) {
    return new TypeError('Expected ' + optionName + ' to be a ' +
      expectedType + ', got ' + typeof optionValue);
  };

  // default options
  let options = {
    verificationURL: 'http://example.com/email-verification/${URL}',
    URLLength: 48,

    // mongo setting
    persistentUserModel: null,
    emailFieldName: 'email',
    passwordFieldName: 'password',
    URLFieldName: 'emailVerifyingUrl',
    expirationTime: 86400,

    // email setting
    transportOptions: {
      service: 'Gamil',
      auth: {
        user: 'user@gmail.com',
        pass: 'password',
      },
    },
    verifyMailOptions: {
      from: 'Do Not Reply <user@gmail.com>',
      subject: 'Confirm your account',
      html: '<p>Please verify your account by clicking ' +
      '<a href="${URL}">this link</a>.' +
      ' If you are unable to do so, copy and ' +
      'paste the following link into your browser:</p><p>${URL}</p>',
      text: 'Please verify your account by clicking the following link, ' +
      'or by copying and pasting it into your browser: ${URL}',
    },
    shouldSendConfirmation: true,
    confirmMailOptions: {
      from: 'Do Not Reply <user@gmail.com>',
      subject: 'Successfully verified',
      html: '<p>Your account has been successfully verified.</p>',
      text: 'Your account has been successfully verified',
    },
  };

  let transporter;

  /**
   * @func configure
   * @param {object} - options to be changed
   * @return promise
   */
  let configure = function(optionsToConfigure) {
    return new Promise((resolve, reject) => {
      for (let key in optionsToConfigure) {
        if (options.hasOwnProperty(key)) {
          options[key] = optionsToConfigure[key];
        }
      }

      transporter = nodemailer.createTransport(options.transportOptions);

      let err = null;

      if (typeof options.verificationURL !== 'string') {
        err = err || createOptionError('verificationURL',
            options.verificationURL, 'string');
      } else if (options.verificationURL.indexOf('${URL}') === -1) {
        err = err || new Error('Verification URL does not contain ${URL}');
      }

      if (typeof options.URLLength !== 'number') {
        err = err || createOptionError('URLLength',
            options.URLLength, 'number');
      } else if (!isPositiveInteger(options.URLLength)) {
        err = err || new Error('URLLength must be a positive integer');
      }

      if (typeof options.emailFieldName !== 'string') {
        err = err || createOptionError('emailFieldName',
            options.emailFieldName, 'string');
      }

      if (typeof options.passwordFieldName !== 'string') {
        err = err || createOptionError('passwordFieldName',
            options.passwordFieldName, 'string');
      }

      if (typeof options.URLFieldName !== 'string') {
        err = err || createOptionError('URLFieldName',
            options.URLFieldName, 'string');
      }

      if (typeof options.expirationTime !== 'number') {
        err = err || createOptionError('expirationTime',
            options.expirationTime, 'number');
      } else if (!isPositiveInteger(options.expirationTime)) {
        err = err || new Error('expirationTime must be a positive integer');
      }

      if (err) {
        reject(err);
      }
      resolve(options);
    });
  };

  /**
   *
   * @param {string} email
   * @param {string} token - the unique token generated for the user
   * @return promise
   */
  let sendVerificationEmail = function(email, token) {
    return new Promise((resolve, reject) => {
      let r = /\$\{URL\}/g;
      const URL = options.verificationURL.replace(r, token);
      let mailOptions = options.verifyMailOptions;
      mailOptions.to = email;
      mailOptions.html = mailOptions.html.replace(r, URL);
      mailOptions.text = mailOptions.text.replace(r, URL);
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          reject(err);
        }
        resolve(info);
      });
    });
  };

  /**
   * @param {string} email
   * @return {Promise}
   */
  let sendConfirmationEmail = function(email) {
    return new Promise((resolve, reject) => {
      let mailOptions = options.confirmMailOptions;
      mailOptions.to = email;
      if (options.shouldSendConfirmation) {
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            reject(err);
          }
          resolve(info);
        });
      }
    });
  };

  /**
   * @param {string} url
   * @return {Promise}
   */
  let confirmVerificationEmail = function(url) {
    return new Promise((resolve, reject) => {
      let User = options.persistentUserModel;
      let query = {};
      query[options.URLFieldName] = url;
      User.findOne(query, (err, UserData) => {
        if (err) {
          reject(err);
        }
        if (!UserData.email.isVerified) {
          User.update({ emailVerifyingUrl: url },
            { $set: { 'email.isVerified': true } },
            (err, info) => {
              if (err) {
                reject(err);
              } else {
                if (options.shouldSendConfirmation) {
                  sendConfirmationEmail(UserData.email.value);
                }
                resolve(UserData);
              }
            }
          );
        } else {
          resolve(null);
        }
      });
    });
  };

  return {
    options: options,
    configure: configure,
    sendConfirmationEmail: sendConfirmationEmail,
    sendVerificationEmail: sendVerificationEmail,
    confirmVerificationEmail: confirmVerificationEmail,
  };
}

let nev = emailVerification();
export default nev;
