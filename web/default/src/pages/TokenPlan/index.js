import React from 'react';
import { Card } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';
import TokenPlansTable from '../../components/TokenPlansTable';

const TokenPlan = () => {
  const { t } = useTranslation();

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='header'>{t('token_plan.title')}</Card.Header>
          <TokenPlansTable />
        </Card.Content>
      </Card>
    </div>
  );
};

export default TokenPlan;