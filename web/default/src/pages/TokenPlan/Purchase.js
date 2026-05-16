import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Grid,
  Header,
  Statistic,
  Divider,
  Icon,
  Segment,
  List,
} from 'semantic-ui-react';
import { API, showError, showSuccess } from '../../helpers';
import { renderQuota } from '../../helpers/render';

const PurchasePlan = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [userQuota, setUserQuota] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);

  const loadPlans = async () => {
    try {
      const res = await API.get('/api/plan');
      const { success, message, data } = res.data;
      if (success) {
        setPlans(data);
      } else {
        showError(message);
      }
    } catch (err) {
      showError(t('token_plan.purchase.load_failed'));
    }
    setLoading(false);
  };

  const loadUserQuota = async () => {
    try {
      const res = await API.get('/api/user/self');
      const { success, message, data } = res.data;
      if (success) {
        setUserQuota(data.quota);
      }
    } catch (err) {
      showError(t('token_plan.purchase.load_failed'));
    }
  };

  const purchasePlan = async (planId) => {
    setPurchasingId(planId);
    try {
      const res = await API.post('/api/plan/purchase', { plan_id: planId });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('token_plan.purchase.success'));
        setUserQuota((prev) => prev + data.quota);
      } else {
        showError(message);
      }
    } catch (err) {
      showError(t('token_plan.purchase.request_failed'));
    }
    setPurchasingId(null);
  };

  useEffect(() => {
    loadPlans().then();
    loadUserQuota().then();
  }, []);

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header>
            <Header as='h2'>
              <Icon name='rocket' />
              {t('token_plan.purchase.title')}
            </Header>
          </Card.Header>

          <Divider />

          <div style={{ textAlign: 'center', marginBottom: '2em' }}>
            <Statistic>
              <Statistic.Value>{renderQuota(userQuota, t)}</Statistic.Value>
              <Statistic.Label>{t('topup.get_code.current_quota')}</Statistic.Label>
            </Statistic>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2em' }}>
              <Icon name='spinner' loading size='large' />
            </div>
          ) : plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2em', color: '#888' }}>
              <Icon name='inbox' size='large' />
              <p>{t('token_plan.purchase.no_plans')}</p>
            </div>
          ) : (
            <Grid columns={3} stackable doubling>
              {plans.map((plan) => (
                <Grid.Column key={plan.id}>
                  <Card fluid raised style={{ height: '100%' }}>
                    <Card.Content>
                      <Card.Header style={{ textAlign: 'center', fontSize: '1.3em' }}>
                        {plan.name}
                      </Card.Header>
                      <Divider />
                      <Card.Description>
                        {plan.description && (
                          <p style={{ textAlign: 'center', color: '#666', minHeight: '2em' }}>
                            {plan.description}
                          </p>
                        )}
                        <List relaxed>
                          <List.Item>
                            <Icon name='database' color='blue' />
                            <List.Content>
                              <List.Header>{t('token_plan.purchase.quota')}</List.Header>
                              <List.Description>{renderQuota(plan.quota, t)}</List.Description>
                            </List.Content>
                          </List.Item>
                          <List.Item>
                            <Icon name='clock' color='teal' />
                            <List.Content>
                              <List.Header>{t('token_plan.purchase.duration')}</List.Header>
                              <List.Description>
                                {plan.duration_days > 0
                                  ? `${plan.duration_days} ${t('token_plan.days')}`
                                  : t('token_plan.unlimited')}
                              </List.Description>
                            </List.Content>
                          </List.Item>
                        </List>
                      </Card.Description>
                    </Card.Content>
                    <Card.Content extra style={{ textAlign: 'center' }}>
                      <Header as='h2' color='red'>
                        ¥{(plan.price / 100).toFixed(2)}
                      </Header>
                      <Button
                        primary
                        fluid
                        size='large'
                        loading={purchasingId === plan.id}
                        disabled={purchasingId !== null}
                        onClick={() => purchasePlan(plan.id)}
                      >
                        {t('token_plan.purchase.buy_now')}
                      </Button>
                    </Card.Content>
                  </Card>
                </Grid.Column>
              ))}
            </Grid>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default PurchasePlan;