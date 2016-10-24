import env from './utils/env';
// just import the injector and don't use it as normal promise
// otherwise you will go into a deadlock
// (webpackIsomorphicTools is waiting for server's webpack-dev-middleware to compiler,
// and the server is waiting for webpackIsomorphicTools' after-compilation-callback)
import './webpackIsomorphicToolsInjector';
import express from 'express';
import mongoose from 'mongoose';
import configs from '../../configs/project/server';
import clientConfigs from '../../configs/project/client';
import middlewares from './middlewares';
import routes from './routes';
import nev from './utils/emailVerification';
import User from './models/User';

const appPromise = new Promise((resolve, reject) => {
  const app = express();
  app.set('env', env);

  // initialize firebase
  if (configs.firebase && clientConfigs.firebase) {
    let firebase = require('firebase');
    firebase.initializeApp({
      serviceAccount: configs.firebase,
      databaseURL: clientConfigs.firebase.databaseURL,
    });
    console.log('[Service] [Firebase]\tenabled');
  } else {
    console.log('[Service] [Firebase]\tdisabled');
  }

  // connect to mongolab
  if (configs.mongo) {
    mongoose.Promise = global.Promise;
    mongoose.connect(configs.mongo[env], (err) => {
      if (err) {
        throw err;
      }
      console.log('[Service] [Mongo]\tenabled');
      middlewares({ app });
      routes({ app });
      return resolve(app);
    });
  } else {
    console.log('[Service] [Mongo]\tdisabled');
    return reject(new Error('MongoDB URI is required'));
  }

  // configure email-verification setting
  nev.configureAsync({
    persistentUserModel: User,
    verificationURL: 'http://localhost:3000/email-verification/${URL}',
    transportOptions: {
      service: 'Gmail',
      auth: {
        user: 'noreply@deeperience.com',
        pass: '123holisi',
      },
    },
  },(err, options) =>{
    if (err) {
      console.log(err);
      return;
    }
  });

  nev.generateTempUserModel(User, function(err, tempUserModel) {
    if (err) {
      console.log(err);
      return;
    }

    console.log('generated temp user model: ' + (typeof tempUserModel === 'function'));
  });

});

export default appPromise;
