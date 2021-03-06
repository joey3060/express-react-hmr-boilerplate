import React from 'react';
import PageLayout from '../../layouts/PageLayout';
import PageHeader from '../../main/PageHeader';
import s from './styles.scss';

const HomePage = (props) => (
  <PageLayout>
    <PageHeader title="Express-React-HMR-Boilerplate" />
    <p className={s.redBorder}>
      This is the demo site for project
      <a href="https://github.com/gocreating/express-react-hmr-boilerplate">
        <span> </span>
        express-react-hmr-boilerplate
      </a>
    </p>
  </PageLayout>
);

export default HomePage;
