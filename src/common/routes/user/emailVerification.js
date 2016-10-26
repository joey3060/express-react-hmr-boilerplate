export default (store) => ({
  path: 'emailVerification',
  getComponent(nextState, cb) {
    require.ensure([], (require) => {
      cb(null, require('../../components/pages/user/SendEmailSuccess').default);
    });
  },
});
