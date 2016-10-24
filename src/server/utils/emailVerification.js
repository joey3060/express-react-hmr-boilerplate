import mongoose from 'mongoose';
import Promise from 'bluebird';

// node email verification
let nev = Promise.promisifyAll(require('email-verification')(mongoose));

export default nev;

